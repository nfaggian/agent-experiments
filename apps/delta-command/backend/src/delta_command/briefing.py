"""LLM-backed chat and executive briefing.

The backend summarises the current state into a compact system prompt, then
calls an OpenAI-compatible chat completions endpoint. Works with OpenAI, Groq,
Ollama, etc. — anything that speaks /v1/chat/completions.

Configure via environment:
    LLM_API_KEY     required (use any placeholder for local Ollama)
    LLM_BASE_URL    default: https://api.openai.com/v1
    LLM_MODEL       default: gpt-4o-mini
"""

from __future__ import annotations

import os

import httpx

from delta_command.models import Database, OpportunityStage, ProjectStatus
from delta_command.store import load_database

CHAT_SYSTEM_PROMPT = (
    "You are Delta, an ops assistant for a delta engineering team. You have live "
    "access to pipeline, project, and team capacity data (summarised below). "
    "Answer questions concisely — usually 2–4 sentences, sometimes a short bulleted "
    "list when it helps clarity. Cite specific names, numbers, and percentages from "
    "the data. If a question is outside what the data can support, say so plainly."
)

BRIEFING_SYSTEM_PROMPT = (
    "You are Delta, an ops assistant for a delta engineering team. Write a concise "
    "executive briefing (2–3 short paragraphs, ~150 words total) that highlights "
    "pipeline health, team capacity concerns, and delivery risks. Lead with what "
    "needs attention. Cite specific names, numbers, and percentages. Use plain "
    "prose — no headings, no bullet lists."
)

BRIEFING_PROMPT = (
    "Write today's executive briefing covering pipeline health, team capacity, and "
    "delivery risks."
)


class LLMNotConfigured(RuntimeError):
    """Raised when LLM_API_KEY is missing."""


class LLMError(RuntimeError):
    """Raised when the upstream provider fails."""


ChatMessage = dict[str, str]  # {"role": "user"|"assistant", "content": str}


def build_context(db: Database) -> str:
    """Compact state summary embedded into every chat's system prompt."""
    engineers = db.engineers
    opps = db.opportunities
    projects = db.projects

    active_opps = [
        o for o in opps if o.stage not in (OpportunityStage.WON, OpportunityStage.LOST)
    ]
    late_stage = [
        o
        for o in active_opps
        if o.stage in (OpportunityStage.PROPOSAL, OpportunityStage.NEGOTIATION)
    ]
    total_pipeline = sum(o.value for o in active_opps)
    weighted = sum(o.value * o.probability / 100 for o in active_opps)

    avg_util = (
        round(sum(e.utilization for e in engineers) / len(engineers)) if engineers else 0
    )
    overallocated = sorted(
        (e for e in engineers if e.utilization >= 100),
        key=lambda e: -e.utilization,
    )
    available = [e for e in engineers if e.utilization < 70]

    active_projects = [
        p for p in projects if p.status in (ProjectStatus.ACTIVE, ProjectStatus.AT_RISK)
    ]
    at_risk = [p for p in projects if p.status == ProjectStatus.AT_RISK]
    total_budget = sum(p.budget for p in active_projects) or 1
    total_spent = sum(p.spent for p in active_projects)

    lines = [
        f"Team: {len(engineers)} engineers, avg utilization {avg_util}%.",
        "Overallocated ({}): {}".format(
            len(overallocated),
            ", ".join(f"{e.name} at {e.utilization}%" for e in overallocated[:8])
            or "none",
        ),
        "Available <70% ({}): {}".format(
            len(available),
            ", ".join(f"{e.name} at {e.utilization}%" for e in available[:6])
            or "none",
        ),
        "",
        f"Pipeline: {len(active_opps)} active opportunities worth "
        f"${total_pipeline/1_000_000:.1f}M "
        f"(${weighted/1_000_000:.1f}M weighted). "
        f"{len(late_stage)} in proposal or negotiation.",
        "Top active opportunities: "
        + ", ".join(
            f"{o.title} ({o.client}, ${o.value/1000:.0f}K, {o.stage.value}, "
            f"{o.probability}%)"
            for o in sorted(active_opps, key=lambda o: -o.value)[:5]
        ),
        "",
        f"Delivery: {len(active_projects)} projects active, {len(at_risk)} at risk. "
        f"Budget burn: ${total_spent/1_000_000:.1f}M of "
        f"${total_budget/1_000_000:.1f}M "
        f"({round(total_spent/total_budget*100)}%).",
    ]
    if at_risk:
        lines.append(
            "At-risk projects: "
            + ", ".join(
                f"{p.name} ({p.progress}% complete, "
                f"${p.spent/1000:.0f}K of ${p.budget/1000:.0f}K)"
                for p in at_risk[:5]
            )
        )
    return "\n".join(lines)


async def call_llm(messages: list[ChatMessage]) -> str:
    """Call the configured LLM with a full message list; return assistant reply."""
    api_key = os.environ.get("LLM_API_KEY")
    if not api_key:
        raise LLMNotConfigured(
            "LLM_API_KEY is not set. Configure an OpenAI-compatible provider "
            "(see backend/README.md)."
        )
    base_url = os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.4,
                },
            )
        except httpx.HTTPError as exc:
            raise LLMError(f"LLM request failed: {exc}") from exc

    if response.status_code >= 400:
        raise LLMError(
            f"LLM provider returned {response.status_code}: {response.text[:200]}"
        )

    try:
        return response.json()["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, ValueError) as exc:
        raise LLMError(f"Unexpected LLM response shape: {exc}") from exc


def _system_message(system_prompt: str) -> ChatMessage:
    """System prompt + current state, formatted for the model."""
    context = build_context(load_database())
    return {
        "role": "system",
        "content": f"{system_prompt}\n\nCurrent state:\n{context}",
    }


async def chat(messages: list[ChatMessage]) -> str:
    """Reply to a conversation using the chat system prompt + current data."""
    return await call_llm([_system_message(CHAT_SYSTEM_PROMPT), *messages])


async def generate_briefing() -> str:
    """One-shot canned briefing prompt (used by the dashboard entry point)."""
    return await call_llm(
        [
            _system_message(BRIEFING_SYSTEM_PROMPT),
            {"role": "user", "content": BRIEFING_PROMPT},
        ]
    )
