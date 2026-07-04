from __future__ import annotations

from delta_command.models import DashboardMetrics, Database, OpportunityStage, ProjectStatus


def compute_dashboard_metrics(db: Database) -> DashboardMetrics:
    active_opportunities = [
        o for o in db.opportunities if o.stage not in (OpportunityStage.WON, OpportunityStage.LOST)
    ]
    pipeline_value = sum(o.value * (o.probability / 100) for o in active_opportunities)
    total_pipeline = sum(o.value for o in active_opportunities)
    active_projects = [
        p for p in db.projects if p.status in (ProjectStatus.ACTIVE, ProjectStatus.AT_RISK)
    ]
    at_risk_projects = [p for p in db.projects if p.status == ProjectStatus.AT_RISK]
    avg_utilization = (
        round(sum(e.utilization for e in db.engineers) / len(db.engineers))
        if db.engineers
        else 0
    )
    available_capacity = sum(1 for e in db.engineers if e.utilization < 70)
    won_this_quarter = sum(1 for o in db.opportunities if o.stage == OpportunityStage.WON)

    return DashboardMetrics(
        pipelineValue=pipeline_value,
        totalPipeline=total_pipeline,
        activeOpportunities=len(active_opportunities),
        activeProjects=len(active_projects),
        atRiskProjects=len(at_risk_projects),
        avgUtilization=avg_utilization,
        availableCapacity=available_capacity,
        wonThisQuarter=won_this_quarter,
        teamSize=len(db.engineers),
        lastUpdated=db.last_updated,
    )
