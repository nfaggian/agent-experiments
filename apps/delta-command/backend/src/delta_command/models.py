from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


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
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    due_date: str = Field(alias="dueDate")
    completed: bool


class Engineer(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    role: str
    email: str
    capacity: int = 100
    utilization: int
    status: EngineerStatus
    skills: list[str] = Field(default_factory=list)
    current_projects: list[str] = Field(default_factory=list, alias="currentProjects")
    avatar: str | None = None


class Opportunity(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    client: str
    stage: OpportunityStage
    value: int
    probability: int
    owner: str
    expected_close: str = Field(alias="expectedClose")
    description: str
    tags: list[str] = Field(default_factory=list)
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")


class Project(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    client: str
    status: ProjectStatus
    progress: int
    start_date: str = Field(alias="startDate")
    end_date: str = Field(alias="endDate")
    budget: int
    spent: int
    lead_engineer: str = Field(alias="leadEngineer")
    team: list[str] = Field(default_factory=list)
    description: str
    milestones: list[Milestone] = Field(default_factory=list)
    opportunity_id: str | None = Field(default=None, alias="opportunityId")


class Database(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    engineers: list[Engineer] = Field(default_factory=list)
    opportunities: list[Opportunity] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    last_updated: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        alias="lastUpdated",
    )


class DashboardMetrics(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    pipeline_value: float = Field(alias="pipelineValue")
    total_pipeline: float = Field(alias="totalPipeline")
    active_opportunities: int = Field(alias="activeOpportunities")
    active_projects: int = Field(alias="activeProjects")
    at_risk_projects: int = Field(alias="atRiskProjects")
    avg_utilization: int = Field(alias="avgUtilization")
    available_capacity: int = Field(alias="availableCapacity")
    won_this_quarter: int = Field(alias="wonThisQuarter")
    team_size: int = Field(alias="teamSize")
    last_updated: str = Field(alias="lastUpdated")


class OpportunityStageUpdate(BaseModel):
    id: str
    stage: OpportunityStage


class ProjectStatusUpdate(BaseModel):
    id: str
    status: ProjectStatus


class EngineerUtilizationUpdate(BaseModel):
    id: str
    utilization: int


class ResetResponse(BaseModel):
    message: str
    last_updated: str = Field(alias="lastUpdated")
