from __future__ import annotations

import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

import yaml
from pydantic import TypeAdapter

from delta_command.models import (
    Database,
    Engineer,
    EngineerStatus,
    Opportunity,
    OpportunityStage,
    Project,
    ProjectStatus,
)

DatabaseAdapter = TypeAdapter(Database)

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "data.yaml"
RUNTIME_CONFIG_PATH = Path(__file__).resolve().parents[2] / "config" / "runtime.yaml"


def _config_path() -> Path:
    return Path(os.environ.get("DELTA_CONFIG_PATH", DEFAULT_CONFIG_PATH))


def _runtime_path() -> Path:
    override = os.environ.get("DELTA_RUNTIME_PATH")
    if override:
        return Path(override)
    return RUNTIME_CONFIG_PATH


def _load_yaml(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def _dump_yaml(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        yaml.dump(
            data,
            handle,
            default_flow_style=False,
            sort_keys=False,
            allow_unicode=True,
        )


def _ensure_runtime_config() -> Path:
    runtime = _runtime_path()
    seed = _config_path()
    if not runtime.exists() or not _load_yaml(runtime).get("engineers"):
        shutil.copy(seed, runtime)
    return runtime


def load_database() -> Database:
    path = _ensure_runtime_config()
    raw = _load_yaml(path)
    return DatabaseAdapter.validate_python(raw)


def save_database(db: Database) -> None:
    path = _ensure_runtime_config()
    db.last_updated = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    payload = db.model_dump(by_alias=True, mode="json")
    _dump_yaml(path, payload)


def update_opportunity_stage(opportunity_id: str, stage: OpportunityStage) -> Opportunity | None:
    db = load_database()
    for index, opportunity in enumerate(db.opportunities):
        if opportunity.id != opportunity_id:
            continue
        updated = opportunity.model_copy(
            update={
                "stage": stage,
                "updated_at": datetime.now(timezone.utc).date().isoformat(),
                "probability": (
                    100
                    if stage == OpportunityStage.WON
                    else 0
                    if stage == OpportunityStage.LOST
                    else opportunity.probability
                ),
            }
        )
        db.opportunities[index] = updated
        save_database(db)
        return updated
    return None


def update_project_status(project_id: str, status: ProjectStatus) -> Project | None:
    db = load_database()
    for index, project in enumerate(db.projects):
        if project.id != project_id:
            continue
        updated = project.model_copy(update={"status": status})
        db.projects[index] = updated
        save_database(db)
        return updated
    return None


def update_engineer_utilization(engineer_id: str, utilization: int) -> Engineer | None:
    db = load_database()
    for index, engineer in enumerate(db.engineers):
        if engineer.id != engineer_id:
            continue
        if utilization >= 100:
            status = EngineerStatus.OVERALLOCATED
        elif utilization >= 50:
            status = EngineerStatus.ALLOCATED
        else:
            status = EngineerStatus.AVAILABLE
        updated = engineer.model_copy(update={"utilization": utilization, "status": status})
        db.engineers[index] = updated
        save_database(db)
        return updated
    return None


def reset_database() -> Database:
    seed = _config_path()
    runtime = _runtime_path()
    shutil.copy(seed, runtime)
    return load_database()
