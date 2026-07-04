from __future__ import annotations

import os

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from delta_command.json_db import database_path
from delta_command.metrics import compute_dashboard_metrics
from delta_command.models import (
    DashboardMetrics,
    Engineer,
    EngineerUtilizationUpdate,
    Opportunity,
    OpportunityStageUpdate,
    Project,
    ProjectStatusUpdate,
    UtilizationTimelineResponse,
    UtilizationTimelineUpdate,
)
from delta_command.store import (
    load_database,
    get_utilization_timeline,
    update_engineer_utilization,
    update_opportunity_stage,
    update_project_status,
    update_timeline_cell,
)

app = FastAPI(
    title="Delta Command API",
    description="Engineering operations backend for pipeline, utilization, and projects.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("DELTA_CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "datastore": "json",
        "path": str(database_path()),
    }


@app.get("/api/dashboard")
def get_dashboard() -> DashboardMetrics:
    db = load_database()
    return compute_dashboard_metrics(db)


@app.get("/api/opportunities")
def list_opportunities() -> list[Opportunity]:
    return load_database().opportunities


@app.patch("/api/opportunities")
def patch_opportunity(body: OpportunityStageUpdate) -> Opportunity:
    updated = update_opportunity_stage(body.id, body.stage)
    if updated is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return updated


@app.get("/api/projects")
def list_projects() -> list[Project]:
    return load_database().projects


@app.patch("/api/projects")
def patch_project(body: ProjectStatusUpdate) -> Project:
    updated = update_project_status(body.id, body.status)
    if updated is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@app.get("/api/engineers")
def list_engineers() -> list[Engineer]:
    return load_database().engineers


@app.patch("/api/engineers")
def patch_engineer(body: EngineerUtilizationUpdate) -> Engineer:
    updated = update_engineer_utilization(body.id, body.utilization)
    if updated is None:
        raise HTTPException(status_code=404, detail="Engineer not found")
    return updated


@app.get("/api/utilization/timeline")
def get_timeline() -> UtilizationTimelineResponse:
    return get_utilization_timeline()


@app.patch("/api/utilization/timeline")
def patch_timeline(body: UtilizationTimelineUpdate) -> UtilizationTimelineResponse:
    try:
        return update_timeline_cell(
            body.engineer_id,
            body.week_start,
            body.utilization,
            body.note,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


def run() -> None:
    host = os.environ.get("DELTA_HOST", "127.0.0.1")
    port = int(os.environ.get("DELTA_PORT", "8000"))
    uvicorn.run("delta_command.main:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    run()
