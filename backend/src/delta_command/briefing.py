"""LLM-generated executive briefings.

The backend summarises the current state into a compact prompt, then calls an
OpenAI-compatible chat completions endpoint. Works with OpenAI, Groq, Ollama,
etc. — anything that speaks the /v1/chat/completions protocol.

Configure via environment:
    LLM_API_KEY     required (use any placeholder for local Ollama)
    LLM_BASE_URL    default: https://api.openai.com/v1
    LLM_MODEL       default: gpt-4o-mini
"""

import os

import httpx

from delta_command.models import Database, OpportunityStage, ProjectStatus
from delta_command.store import load_database

SYSTEM_PROMPT = (
    "You are an executive briefing assistant for a delta engineering operations "
    "dashboard. Given the current state, write a concise leadership briefing "
    "(2-3 short paragraphs, ~150 words total) that highlights: pipeline health, "
    "team capacity concerns, and delivery risks. Lead with what needs attention. "
    "Use plain prose, no bullet lists, no headings."
)


class LLMNotConfigured(RuntimeError):
    """Raised when LLM_API_KEY is missing."""


class LLMError(RuntimeError):
    """Raised when the upstream provider fails."""


def build_context(db: Database) -> str:
    """Compact state summary used as the LLM user prompt."""
    engineers = db.engineers
    opps = db.opportunities
    projects = db.projects

    active_opps = [o for o in opps if o.stage not in (OpportunityStage.WON, OpportunityStage.LOST)]
    late_stage = [o for o in active_opps if o.stage in (OpportunityStage.PROPOSAL, OpportunityStage.NEGOTIATION)]
    total_pipeline = sum(o.value for o in active_opps)
    weighted = sum(o.value * o.probability / 100 for o in active_opps)

    avg_util = round(sum(e.utilization for e in engineers) / len(engineers)) if engineers else 0
    overallocated = sorted(
        (e for e in engineers if e.utilization >= 100),
        key=lambda e: -e.utilization,
    )
    unassigned = [e for e in engineers if not e.current_projects]

    active_projects = [p for p in projects if p.status in (ProjectStatus.ACTIVE, ProjectStatus.AT_RISK)]
    at_risk = [p for p in projects if p.status == ProjectStatus.AT_RISK]
    total_budget = sum(p.budget for p in active_projects) or 1
    total_spent = sum(p.spent for p in active_projects)

    lines = [
        f"Team: {len(engineers)} engineers, avg utilization {avg_util}%.",
        f"Overallocated ({len(overallocated)}): "
        + (", ".join(f"{e.name} at {e.utilization}%" for e in overallocated[:5]) or "none"),
        f"Available for assignment: {len(unassigned)}.",
        "",
        f"Pipeline: {len(active_opps)} active opportunities worth ${total_pipeline/1_000_000:.1f}M "
        f"(${weighted/1_000_000:.1f}M weighted). {len(late_stage)} in proposal or negotiation.",
        "",
        f"Delivery: {len(active_projects)} projects active, {len(at_risk)} at risk. "
        f"Budget burn: ${total_spent/1_000_000:.1f}M of ${total_budget/1_000_000:.1f}M "
        f"({round(total_spent/total_budget*100)}%).",
    ]
    if at_risk:
        lines.append(
            "At-risk projects: "
            + ", ".join(f"{p.name} ({p.progress}% complete)" for p in at_risk[:3])
        )
    return "\n".join(lines)


async def call_llm(system: str, user: str) -> str:
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
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "temperature": 0.4,
                },
            )
        except httpx.HTTPError as exc:
            raise LLMError(f"LLM request failed: {exc}") from exc

    if response.status_code >= 400:
        raise LLMError(f"LLM provider returned {response.status_code}: {response.text[:200]}")

    try:
        return response.json()["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, ValueError) as exc:
        raise LLMError(f"Unexpected LLM response shape: {exc}") from exc


async def generate_briefing() -> str:
    return await call_llm(SYSTEM_PROMPT, build_context(load_database()))
