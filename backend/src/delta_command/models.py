"""Pydantic models for the Delta Command database.

Python fields are snake_case; JSON is camelCase (via a shared alias generator).
"""

from datetime import datetime, timezone
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

_CAMEL = ConfigDict(alias_generator=to_camel, populate_by_name=True)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class OpportunityStage(StrEnum):
    PROSPECT = "prospect"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class ProjectStatus(StrEnum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    AT_RISK = "at_risk"


class EngineerStatus(StrEnum):
    AVAILABLE = "available"
    ALLOCATED = "allocated"
    OVERALLOCATED = "overallocated"


class Milestone(BaseModel):
    model_config = _CAMEL
    id: str
    title: str
    due_date: str
    completed: bool


class UtilizationWeek(BaseModel):
    model_config = _CAMEL
    week_start: str
    utilization: int
    note: str | None = None


class Engineer(BaseModel):
    model_config = _CAMEL
    id: str
    name: str
    role: str
    email: str
    capacity: int = 100
    utilization: int
    status: EngineerStatus
    skills: list[str] = Field(default_factory=list)
    current_projects: list[str] = Field(default_factory=list)
    utilization_timeline: list[UtilizationWeek] = Field(default_factory=list)
    avatar: str | None = None


class Opportunity(BaseModel):
    model_config = _CAMEL
    id: str
    title: str
    client: str
    stage: OpportunityStage
    value: int
    probability: int
    owner: str
    expected_close: str
    description: str
    tags: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str


class Project(BaseModel):
    model_config = _CAMEL
    id: str
    name: str
    client: str
    status: ProjectStatus
    progress: int
    start_date: str
    end_date: str
    budget: int
    spent: int
    lead_engineer: str
    team: list[str] = Field(default_factory=list)
    description: str
    milestones: list[Milestone] = Field(default_factory=list)
    opportunity_id: str | None = None


class Database(BaseModel):
    model_config = _CAMEL
    engineers: list[Engineer] = Field(default_factory=list)
    opportunities: list[Opportunity] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    last_updated: str = Field(default_factory=_now_iso)


class OpportunityStageUpdate(BaseModel):
    id: str
    stage: OpportunityStage


class ProjectStatusUpdate(BaseModel):
    id: str
    status: ProjectStatus


class TimelineCellUpdate(BaseModel):
    model_config = _CAMEL
    engineer_id: str
    week_start: str
    utilization: int
    note: str | None = None
