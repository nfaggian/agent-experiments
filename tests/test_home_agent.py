"""Tests for home agent guardrails and skills."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from google.adk.models import LlmRequest
from google.genai import types

AGENTS_DIR = Path(__file__).resolve().parents[1] / "src" / "agents"
if str(AGENTS_DIR) not in sys.path:
    sys.path.insert(0, str(AGENTS_DIR))

from home_agent.guardrails.loader import (  # noqa: E402
    GuardrailConfig,
    create_guardrail_callbacks,
)
from home_agent.skills.loader import load_skill_tools, load_skills_config  # noqa: E402


def test_load_skills_config_includes_home_assistant() -> None:
    skills = load_skills_config()
    names = {skill.name for skill in skills}
    assert "home_assistant" in names
    assert "routines" in names


def test_load_skill_tools_returns_callables() -> None:
    tools, instructions = load_skill_tools()
    assert len(tools) >= 5
    assert any("Home Assistant" in instruction for instruction in instructions)


def test_guardrail_blocks_dangerous_topic() -> None:
    config = GuardrailConfig(blocked_topics=["unlock all doors"])
    callbacks = create_guardrail_callbacks(config)

    request = LlmRequest(
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text="Please unlock all doors now")],
            )
        ]
    )

    class DummyContext:
        agent_name = "test"

    response = callbacks["before_model_callback"](DummyContext(), request)
    assert response is not None
    assert response.content is not None
    assert response.content.parts[0].text


def test_guardrail_blocks_disallowed_domain() -> None:
    config = GuardrailConfig(
        allowed_domains=["light", "switch"],
        response_on_block="blocked",
    )
    callbacks = create_guardrail_callbacks(config)

    class DummyTool:
        name = "call_service"

    class DummyContext:
        state: dict[str, str] = {}

    result = callbacks["before_tool_callback"](
        DummyTool(),
        {"domain": "lock", "entity_id": "lock.garage"},
        DummyContext(),
    )
    assert result is not None
    assert "error" in result


def test_guardrail_requires_confirmation_for_routines() -> None:
    config = GuardrailConfig(confirm_tools=["run_routine"])
    callbacks = create_guardrail_callbacks(config)

    class DummyTool:
        name = "run_routine"

    class DummyContext:
        state: dict[str, str] = {}

    result = callbacks["before_tool_callback"](
        DummyTool(),
        {"routine_name": "away"},
        DummyContext(),
    )
    assert result is not None
    assert result["status"] == "confirmation_required"
