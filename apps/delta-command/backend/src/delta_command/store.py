"""Domain operations backed by the JSON file store."""

from datetime import datetime, timezone

from pydantic import TypeAdapter

from delta_command.json_db import database_path, load_json, save_json
from delta_command.models import (
    Database,
    EngineerStatus,
    Opportunity,
    OpportunityStage,
    Project,
    ProjectStatus,
)

_DB = TypeAdapter(Database)


def load_database() -> Database:
    return _DB.validate_python(load_json(database_path()))


def save_database(db: Database) -> None:
    db.last_updated = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    save_json(database_path(), db.model_dump(by_alias=True, mode="json"))


def _status_for(utilization: int) -> EngineerStatus:
    if utilization >= 100:
        return EngineerStatus.OVERALLOCATED
    if utilization >= 50:
        return EngineerStatus.ALLOCATED
    return EngineerStatus.AVAILABLE


def update_opportunity_stage(opp_id: str, stage: OpportunityStage) -> Opportunity | None:
    db = load_database()
    for i, opp in enumerate(db.opportunities):
        if opp.id != opp_id:
            continue
        probability = 100 if stage == OpportunityStage.WON else 0 if stage == OpportunityStage.LOST else opp.probability
        db.opportunities[i] = opp.model_copy(
            update={
                "stage": stage,
                "probability": probability,
                "updated_at": datetime.now(timezone.utc).date().isoformat(),
            }
        )
        save_database(db)
        return db.opportunities[i]
    return None


def update_project_status(project_id: str, status: ProjectStatus) -> Project | None:
    db = load_database()
    for i, project in enumerate(db.projects):
        if project.id != project_id:
            continue
        db.projects[i] = project.model_copy(update={"status": status})
        save_database(db)
        return db.projects[i]
    return None


def update_timeline_cell(
    engineer_id: str, week_start: str, utilization: int, note: str | None = None
) -> Database:
    """Update one week cell for one engineer. Clamps utilization to [0, 150]."""
    utilization = max(0, min(150, utilization))
    db = load_database()
    for i, engineer in enumerate(db.engineers):
        if engineer.id != engineer_id:
            continue
        timeline = list(engineer.utilization_timeline)
        for j, cell in enumerate(timeline):
            if cell.week_start == week_start:
                timeline[j] = cell.model_copy(update={"utilization": utilization, "note": note})
                break
        else:
            raise ValueError(f"Week {week_start} not found for engineer {engineer_id}")

        current = _current_week_utilization(timeline)
        db.engineers[i] = engineer.model_copy(
            update={
                "utilization_timeline": timeline,
                "utilization": current,
                "status": _status_for(current),
            }
        )
        save_database(db)
        return db
    raise ValueError(f"Engineer {engineer_id} not found")


def _current_week_utilization(timeline: list) -> int:
    """Best-effort 'current' utilization: today's week if present, else the last cell."""
    from datetime import date, timedelta

    monday = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    for cell in timeline:
        if cell.week_start == monday:
            return cell.utilization
    return timeline[-1].utilization if timeline else 0
