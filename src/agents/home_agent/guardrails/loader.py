"""Load guardrail policies and wire them into ADK callbacks."""

from __future__ import annotations

import fnmatch
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmRequest, LlmResponse
from google.adk.tools.tool_context import ToolContext
from google.genai import types

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "guardrails.yaml"


@dataclass
class GuardrailConfig:
    blocked_topics: list[str] = field(default_factory=list)
    blocked_tools: list[str] = field(default_factory=list)
    confirm_tools: list[str] = field(default_factory=list)
    allowed_domains: list[str] = field(default_factory=list)
    blocked_entities: list[str] = field(default_factory=list)
    temperature_min_celsius: int = 16
    temperature_max_celsius: int = 30
    response_on_block: str = "I can't help with that request."


def load_guardrail_config(path: Path | None = None) -> GuardrailConfig:
    config_path = path or DEFAULT_CONFIG_PATH
    with config_path.open(encoding="utf-8") as config_file:
        raw = yaml.safe_load(config_file) or {}

    guardrails = raw.get("guardrails", {})
    temperature = guardrails.get("temperature", {})
    return GuardrailConfig(
        blocked_topics=[topic.lower() for topic in guardrails.get("blocked_topics", [])],
        blocked_tools=guardrails.get("blocked_tools", []),
        confirm_tools=guardrails.get("confirm_tools", []),
        allowed_domains=guardrails.get("allowed_domains", []),
        blocked_entities=guardrails.get("blocked_entities", []),
        temperature_min_celsius=temperature.get("min_celsius", 16),
        temperature_max_celsius=temperature.get("max_celsius", 30),
        response_on_block=guardrails.get("response_on_block", "I can't help with that request."),
    )


def _latest_user_text(llm_request: LlmRequest) -> str:
    for content in reversed(llm_request.contents or []):
        if content.role != "user":
            continue
        for part in content.parts or []:
            if part.text:
                return part.text.lower()
    return ""


def _blocked_response(config: GuardrailConfig) -> LlmResponse:
    return LlmResponse(
        content=types.Content(
            role="model",
            parts=[types.Part(text=config.response_on_block)],
        )
    )


def _entity_is_blocked(entity_id: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(entity_id, pattern) for pattern in patterns)


def create_guardrail_callbacks(
    config: GuardrailConfig | None = None,
) -> dict[str, Any]:
    """Return ADK callback callables configured from guardrail policy."""

    policy = config or load_guardrail_config()

    def before_model_callback(
        callback_context: CallbackContext,
        llm_request: LlmRequest,
    ) -> LlmResponse | None:
        del callback_context
        user_text = _latest_user_text(llm_request)
        if not user_text:
            return None

        for topic in policy.blocked_topics:
            if topic in user_text:
                return _blocked_response(policy)
        return None

    def before_tool_callback(
        tool: Any,
        args: dict[str, Any],
        tool_context: ToolContext,
    ) -> dict[str, Any] | None:
        del tool_context
        tool_name = getattr(tool, "name", getattr(tool, "__name__", ""))

        if tool_name in policy.blocked_tools:
            return {"error": policy.response_on_block}

        if tool_name == "call_service":
            domain = str(args.get("domain", ""))
            entity_id = str(args.get("entity_id", ""))

            if policy.allowed_domains and domain not in policy.allowed_domains:
                return {
                    "error": (
                        f"Domain '{domain}' is not allowed. "
                        f"Allowed domains: {', '.join(policy.allowed_domains)}"
                    )
                }

            if entity_id and _entity_is_blocked(entity_id, policy.blocked_entities):
                return {"error": f"Entity '{entity_id}' is protected by guardrails."}

            if domain == "climate" and "temperature" in args:
                temperature = float(args["temperature"])
                if not policy.temperature_min_celsius <= temperature <= policy.temperature_max_celsius:
                    return {
                        "error": (
                            "Temperature must be between "
                            f"{policy.temperature_min_celsius}°C and "
                            f"{policy.temperature_max_celsius}°C."
                        )
                    }

        if tool_name in policy.confirm_tools:
            confirmation = str(args.get("confirm", "")).lower()
            if confirmation not in {"yes", "true", "confirmed"}:
                return {
                    "status": "confirmation_required",
                    "message": (
                        "Please confirm this action by repeating your request and "
                        "including the word 'confirm'."
                    ),
                }

        return None

    return {
        "before_model_callback": before_model_callback,
        "before_tool_callback": before_tool_callback,
    }
