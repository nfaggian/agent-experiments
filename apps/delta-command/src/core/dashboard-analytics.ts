import type { Engineer, Opportunity, Project } from "./types";
import { daysUntil, formatCurrency } from "./utils";

export type ActionSeverity = "critical" | "warning" | "info";

export interface ActionItem {
  id: string;
  severity: ActionSeverity;
  title: string;
  detail: string;
  href: string;
}

export interface MilestoneItem {
  id: string;
  title: string;
  projectName: string;
  dueDate: string;
  daysUntil: number;
  overdue: boolean;
}

/** Only the fields actually rendered on the dashboard live here. */
export interface PipelineInsight {
  closingWithin30Days: number;
  closingValue30Days: number;
}

export interface DeliveryInsight {
  totalBudget: number;
  totalSpent: number;
  burnPercent: number;
  planningCount: number;
  atRiskCount: number;
}

export interface TeamInsight {
  overallocated: Engineer[];
  benchCapacityPercent: number;
}

export interface DashboardInsights {
  actions: ActionItem[];
  milestones: MilestoneItem[];
  pipeline: PipelineInsight;
  delivery: DeliveryInsight;
  team: TeamInsight;
}

function isActive(o: Opportunity): boolean {
  return !["won", "lost"].includes(o.stage);
}

export function buildDashboardInsights(
  engineers: Engineer[],
  opportunities: Opportunity[],
  projects: Project[]
): DashboardInsights {
  const activeOpps = opportunities.filter(isActive);
  const closingSoon = activeOpps.filter((o) => {
    const days = daysUntil(o.expectedClose);
    return days >= 0 && days <= 30;
  });

  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "at_risk"
  );
  const totalBudget = activeProjects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = activeProjects.reduce((s, p) => s + p.spent, 0);

  const allMilestones: MilestoneItem[] = projects.flatMap((project) =>
    project.milestones
      .filter((m) => !m.completed)
      .map((m) => {
        const d = daysUntil(m.dueDate);
        return {
          id: m.id,
          title: m.title,
          projectName: project.name,
          dueDate: m.dueDate,
          daysUntil: d,
          overdue: d < 0,
        };
      })
  );
  const sortedMilestones = [...allMilestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const overdue = sortedMilestones.filter((m) => m.overdue);
  const dueIn14 = sortedMilestones.filter((m) => !m.overdue && m.daysUntil <= 14);

  const overallocated = engineers.filter((e) => e.status === "overallocated");
  const unassigned = engineers.filter((e) => e.currentProjects.length === 0);

  const benchCapacityPercent =
    engineers.length > 0
      ? Math.round(
          engineers.reduce((sum, e) => sum + Math.max(0, 100 - e.utilization), 0) /
            engineers.length
        )
      : 0;

  const actions: ActionItem[] = [];

  for (const project of projects.filter((p) => p.status === "at_risk")) {
    actions.push({
      id: `risk-${project.id}`,
      severity: "critical",
      title: `${project.name} is at risk`,
      detail: `${project.progress}% complete · ${Math.round((project.spent / project.budget) * 100)}% budget used`,
      href: "/projects",
    });
  }

  for (const eng of overallocated) {
    actions.push({
      id: `over-${eng.id}`,
      severity: "critical",
      title: `${eng.name} is overallocated`,
      detail: `${eng.utilization}% utilization across ${eng.currentProjects.length} projects`,
      href: "/team",
    });
  }

  for (const m of overdue) {
    actions.push({
      id: `ms-over-${m.id}`,
      severity: "critical",
      title: `Overdue milestone: ${m.title}`,
      detail: `${m.projectName} · due ${m.dueDate}`,
      href: "/projects",
    });
  }

  for (const opp of activeOpps) {
    const days = daysUntil(opp.expectedClose);
    if (days < 0 || days > 7) continue;
    actions.push({
      id: `close-${opp.id}`,
      severity: "warning",
      title: `Close imminent: ${opp.client}`,
      detail: `${formatCurrency(opp.value)} · ${opp.probability}% probability · ${days}d left`,
      href: "/opportunities",
    });
  }

  for (const m of dueIn14) {
    actions.push({
      id: `ms-soon-${m.id}`,
      severity: "warning",
      title: `Milestone due: ${m.title}`,
      detail: `${m.projectName} · in ${m.daysUntil} day${m.daysUntil === 1 ? "" : "s"}`,
      href: "/projects",
    });
  }

  for (const project of activeProjects.filter((p) => p.spent / p.budget >= 0.9)) {
    actions.push({
      id: `budget-${project.id}`,
      severity: "warning",
      title: `Budget nearly exhausted: ${project.name}`,
      detail: `${Math.round((project.spent / project.budget) * 100)}% of ${formatCurrency(project.budget)} spent`,
      href: "/projects",
    });
  }

  if (unassigned.length > 0) {
    actions.push({
      id: "bench-available",
      severity: "info",
      title: `${unassigned.length} engineer${unassigned.length > 1 ? "s" : ""} available for assignment`,
      detail: unassigned.map((e) => e.name.split(" ")[0]).join(", "),
      href: "/team",
    });
  }

  const severityOrder: Record<ActionSeverity, number> = { critical: 0, warning: 1, info: 2 };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    actions,
    milestones: sortedMilestones.slice(0, 8),
    pipeline: {
      closingWithin30Days: closingSoon.length,
      closingValue30Days: closingSoon.reduce((s, o) => s + o.value, 0),
    },
    delivery: {
      totalBudget,
      totalSpent,
      burnPercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      planningCount: projects.filter((p) => p.status === "planning").length,
      atRiskCount: projects.filter((p) => p.status === "at_risk").length,
    },
    team: { overallocated, benchCapacityPercent },
  };
}
