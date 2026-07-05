"""Delta Command HTTP API — a thin CRUD + chat layer over a JSON file."""

import os

import uvicorn
from fastapi import FastAPI, HTTPException

from delta_command.briefing import (
    LLMError,
    LLMNotConfigured,
    chat,
    generate_briefing,
)
from delta_command.models import (
    ChatRequest,
    Database,
    Opportunity,
    OpportunityStageUpdate,
    Project,
    ProjectStatusUpdate,
    TimelineCellUpdate,
)
from delta_command.store import (
    load_database,
    update_opportunity_stage,
    update_project_status,
    update_timeline_cell,
)

app = FastAPI(title="Delta Command API", version="1.2.0")


@app.get("/api/state")
def get_state() -> Database:
    """Return the entire database. The frontend derives every metric from this."""
    return load_database()


@app.patch("/api/opportunities")
def patch_opportunity(body: OpportunityStageUpdate) -> Opportunity:
    updated = update_opportunity_stage(body.id, body.stage)
    if updated is None:
        raise HTTPException(404, "Opportunity not found")
    return updated


@app.patch("/api/projects")
def patch_project(body: ProjectStatusUpdate) -> Project:
    updated = update_project_status(body.id, body.status)
    if updated is None:
        raise HTTPException(404, "Project not found")
    return updated


@app.patch("/api/timeline")
def patch_timeline(body: TimelineCellUpdate) -> Database:
    try:
        return update_timeline_cell(
            body.engineer_id, body.week_start, body.utilization, body.note
        )
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc


@app.post("/api/chat")
async def post_chat(body: ChatRequest) -> dict[str, str]:
    """Reply to a conversation. The system prompt embeds the current database."""
    if not body.messages:
        raise HTTPException(400, "messages must not be empty")
    try:
        reply = await chat([m.model_dump() for m in body.messages])
    except LLMNotConfigured as exc:
        raise HTTPException(503, str(exc)) from exc
    except LLMError as exc:
        raise HTTPException(502, str(exc)) from exc
    return {"reply": reply}


@app.post("/api/briefing")
async def post_briefing() -> dict[str, str]:
    """One-shot executive briefing — a canned first-turn prompt."""
    try:
        briefing = await generate_briefing()
    except LLMNotConfigured as exc:
        raise HTTPException(503, str(exc)) from exc
    except LLMError as exc:
        raise HTTPException(502, str(exc)) from exc
    return {"briefing": briefing}


def run() -> None:
    host = os.environ.get("DELTA_HOST", "127.0.0.1")
    port = int(os.environ.get("DELTA_PORT", "8000"))
    uvicorn.run("delta_command.main:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    run()
