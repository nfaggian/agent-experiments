import type { Engineer, Opportunity, Project } from "./types";
import { daysUntil } from "./utils";

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

export interface PipelineInsight {
  winRate: number;
  wonCount: number;
  lostCount: number;
  wonValue: number;
  closingWithin30Days: number;
  closingValue30Days: number;
  inNegotiation: number;
  negotiationValue: number;
  avgDealSize: number;
  avgProbability: number;
}

export interface DeliveryInsight {
  totalBudget: number;
  totalSpent: number;
  burnPercent: number;
  activeCount: number;
  planningCount: number;
  atRiskCount: number;
  milestonesDue14Days: number;
  overdueMilestones: number;
  projectsEnding30Days: number;
}

export interface TeamInsight {
  overallocated: Engineer[];
  available: Engineer[];
  benchCapacityPercent: number;
  unassigned: Engineer[];
}

export interface DashboardInsights {
  actions: ActionItem[];
  milestones: MilestoneItem[];
  pipeline: PipelineInsight;
  delivery: DeliveryInsight;
  team: TeamInsight;
}

function isActiveOpportunity(o: Opportunity): boolean {
  return !["won", "lost"].includes(o.stage);
}

export function buildDashboardInsights(
  engineers: Engineer[],
  opportunities: Opportunity[],
  projects: Project[]
): DashboardInsights {
  const activeOpps = opportunities.filter(isActiveOpportunity);
  const won = opportunities.filter((o) => o.stage === "won");
  const lost = opportunities.filter((o) => o.stage === "lost");
  const closed = won.length + lost.length;

  const closingSoon = activeOpps.filter((o) => {
    const days = daysUntil(o.expectedClose);
    return days >= 0 && days <= 30;
  });

  const inNegotiation = activeOpps.filter((o) => o.stage === "negotiation");

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

  const overdueMilestones = sortedMilestones.filter((m) => m.overdue);
  const milestonesDue14 = sortedMilestones.filter(
    (m) => !m.overdue && m.daysUntil <= 14
  );

  const overallocated = engineers.filter((e) => e.status === "overallocated");
  const available = engineers.filter((e) => e.utilization < 70);
  const unassigned = engineers.filter((e) => e.currentProjects.length === 0);

  const benchCapacity = engineers.reduce(
    (sum, e) => sum + Math.max(0, 100 - e.utilization),
    0
  );
  const benchCapacityPercent =
    engineers.length > 0
      ? Math.round(benchCapacity / engineers.length)
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

  for (const m of overdueMilestones) {
    actions.push({
      id: `ms-over-${m.id}`,
      severity: "critical",
      title: `Overdue milestone: ${m.title}`,
      detail: `${m.projectName} · due ${m.dueDate}`,
      href: "/projects",
    });
  }

  for (const opp of activeOpps.filter((o) => daysUntil(o.expectedClose) <= 7 && daysUntil(o.expectedClose) >= 0)) {
    actions.push({
      id: `close-${opp.id}`,
      severity: "warning",
      title: `Close imminent: ${opp.client}`,
      detail: `${formatCurrencyShort(opp.value)} · ${opp.probability}% probability · ${daysUntil(opp.expectedClose)}d left`,
      href: "/opportunities",
    });
  }

  for (const m of milestonesDue14) {
    actions.push({
      id: `ms-soon-${m.id}`,
      severity: "warning",
      title: `Milestone due: ${m.title}`,
      detail: `${m.projectName} · in ${m.daysUntil} day${m.daysUntil === 1 ? "" : "s"}`,
      href: "/projects",
    });
  }

  for (const project of activeProjects.filter(
    (p) => p.spent / p.budget >= 0.9
  )) {
    actions.push({
      id: `budget-${project.id}`,
      severity: "warning",
      title: `Budget nearly exhausted: ${project.name}`,
      detail: `${Math.round((project.spent / project.budget) * 100)}% of ${formatCurrencyShort(project.budget)} spent`,
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

  const severityOrder: Record<ActionSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    actions,
    milestones: sortedMilestones.slice(0, 8),
    pipeline: {
      winRate: closed > 0 ? Math.round((won.length / closed) * 100) : 0,
      wonCount: won.length,
      lostCount: lost.length,
      wonValue: won.reduce((s, o) => s + o.value, 0),
      closingWithin30Days: closingSoon.length,
      closingValue30Days: closingSoon.reduce((s, o) => s + o.value, 0),
      inNegotiation: inNegotiation.length,
      negotiationValue: inNegotiation.reduce((s, o) => s + o.value, 0),
      avgDealSize:
        activeOpps.length > 0
          ? Math.round(
              activeOpps.reduce((s, o) => s + o.value, 0) / activeOpps.length
            )
          : 0,
      avgProbability:
        activeOpps.length > 0
          ? Math.round(
              activeOpps.reduce((s, o) => s + o.probability, 0) /
                activeOpps.length
            )
          : 0,
    },
    delivery: {
      totalBudget,
      totalSpent,
      burnPercent:
        totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      activeCount: projects.filter((p) => p.status === "active").length,
      planningCount: projects.filter((p) => p.status === "planning").length,
      atRiskCount: projects.filter((p) => p.status === "at_risk").length,
      milestonesDue14Days: milestonesDue14.length,
      overdueMilestones: overdueMilestones.length,
      projectsEnding30Days: projects.filter((p) => {
        const d = daysUntil(p.endDate);
        return d >= 0 && d <= 30 && p.status !== "completed";
      }).length,
    },
    team: {
      overallocated,
      available,
      benchCapacityPercent,
      unassigned,
    },
  };
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}
