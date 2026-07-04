from __future__ import annotations

from datetime import date, timedelta

from delta_command.models import Engineer, EngineerStatus, UtilizationWeek

TIMELINE_WEEKS = 8


def _week_start(value: date) -> date:
    return value - timedelta(days=value.weekday())


def week_label(week_start: date) -> str:
    return week_start.strftime("%b %d")


def build_week_columns(reference: date | None = None) -> list[dict]:
    today = reference or date.today()
    current_start = _week_start(today)
    start = current_start - timedelta(weeks=2)
    columns: list[dict] = []
    for offset in range(TIMELINE_WEEKS):
        week_start = start + timedelta(weeks=offset)
        columns.append(
            {
                "weekStart": week_start.isoformat(),
                "label": week_label(week_start),
                "isCurrent": week_start == current_start,
            }
        )
    return columns


def seed_timeline(engineer: Engineer, week_columns: list[dict]) -> list[UtilizationWeek]:
    base = engineer.utilization
    timeline: list[UtilizationWeek] = []
    for index, week in enumerate(week_columns):
        drift = (index - 2) * 3
        value = max(0, min(150, base + drift - (index % 3) * 5))
        timeline.append(
            UtilizationWeek(
                weekStart=week["weekStart"],
                utilization=value,
            )
        )
    return timeline


def ensure_engineer_timeline(
    engineer: Engineer, week_columns: list[dict]
) -> Engineer:
    if engineer.utilization_timeline:
        by_week = {item.week_start: item for item in engineer.utilization_timeline}
        merged: list[UtilizationWeek] = []
        for week in week_columns:
            existing = by_week.get(week["weekStart"])
            if existing:
                merged.append(existing)
            else:
                merged.append(
                    UtilizationWeek(
                        weekStart=week["weekStart"],
                        utilization=engineer.utilization,
                    )
                )
        return engineer.model_copy(update={"utilization_timeline": merged})
    return engineer.model_copy(
        update={"utilization_timeline": seed_timeline(engineer, week_columns)}
    )


def current_week_utilization(engineer: Engineer, week_columns: list[dict]) -> int:
    current = next((w for w in week_columns if w["isCurrent"]), week_columns[-1])
    for item in engineer.utilization_timeline:
        if item.week_start == current["weekStart"]:
            return item.utilization
    return engineer.utilization


def status_for_utilization(utilization: int) -> EngineerStatus:
    if utilization >= 100:
        return EngineerStatus.OVERALLOCATED
    if utilization >= 50:
        return EngineerStatus.ALLOCATED
    return EngineerStatus.AVAILABLE
