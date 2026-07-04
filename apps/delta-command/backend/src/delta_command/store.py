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
    Opportunity,
    OpportunityStage,
    Project,
    ProjectStatus,
    UtilizationTimelineResponse,
    UtilizationTimelineRow,
    UtilizationTimelineCell,
    UtilizationTimelineWeek,
)
from delta_command.utilization_timeline import (
    build_week_columns,
    current_week_utilization,
    ensure_engineer_timeline,
    status_for_utilization,
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
    week_columns = build_week_columns()
    for index, engineer in enumerate(db.engineers):
        if engineer.id != engineer_id:
            continue
        engineer = ensure_engineer_timeline(engineer, week_columns)
        status = status_for_utilization(utilization)
        timeline = list(engineer.utilization_timeline)
        current = next((w for w in week_columns if w["isCurrent"]), week_columns[-1])
        for cell_index, cell in enumerate(timeline):
            if cell.week_start == current["weekStart"]:
                timeline[cell_index] = cell.model_copy(update={"utilization": utilization})
                break
        updated = engineer.model_copy(
            update={"utilization": utilization, "status": status, "utilization_timeline": timeline}
        )
        db.engineers[index] = updated
        save_database(db)
        return updated
    return None


def get_utilization_timeline() -> UtilizationTimelineResponse:
    db = load_database()
    week_columns = build_week_columns()
    engineers = [ensure_engineer_timeline(e, week_columns) for e in db.engineers]
    if any(
        e.utilization_timeline != db.engineers[i].utilization_timeline
        for i, e in enumerate(engineers)
    ):
        db.engineers = engineers
        save_database(db)

    weeks = [
        UtilizationTimelineWeek(
            weekStart=column["weekStart"],
            label=column["label"],
            isCurrent=column["isCurrent"],
        )
        for column in week_columns
    ]
    rows: list[UtilizationTimelineRow] = []
    for engineer in engineers:
        rows.append(
            UtilizationTimelineRow(
                engineerId=engineer.id,
                name=engineer.name,
                role=engineer.role,
                cells=[
                    UtilizationTimelineCell(
                        weekStart=cell.week_start,
                        utilization=cell.utilization,
                        note=cell.note,
                    )
                    for cell in engineer.utilization_timeline
                ],
            )
        )
    return UtilizationTimelineResponse(weeks=weeks, rows=rows)


def update_timeline_cell(
    engineer_id: str,
    week_start: str,
    utilization: int,
    note: str | None = None,
) -> UtilizationTimelineResponse:
    db = load_database()
    week_columns = build_week_columns()
    utilization = max(0, min(150, utilization))
    found = False

    for index, engineer in enumerate(db.engineers):
        if engineer.id != engineer_id:
            continue
        engineer = ensure_engineer_timeline(engineer, week_columns)
        timeline = list(engineer.utilization_timeline)
        for cell_index, cell in enumerate(timeline):
            if cell.week_start != week_start:
                continue
            timeline[cell_index] = cell.model_copy(
                update={"utilization": utilization, "note": note}
            )
            found = True
            break
        current_util = current_week_utilization(
            engineer.model_copy(update={"utilization_timeline": timeline}),
            week_columns,
        )
        db.engineers[index] = engineer.model_copy(
            update={
                "utilization_timeline": timeline,
                "utilization": current_util,
                "status": status_for_utilization(current_util),
            }
        )
        break

    if not found:
        raise ValueError("Engineer or week not found")

    save_database(db)
    return get_utilization_timeline()


def reset_database() -> Database:
    seed = _config_path()
    runtime = _runtime_path()
    shutil.copy(seed, runtime)
    return load_database()
