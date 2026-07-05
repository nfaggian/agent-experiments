import Link from "next/link";
import { DollarSign, FolderKanban, Flame, Users, CalendarClock } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { UtilizationChart } from "@/components/dashboard/UtilizationChart";
import { ActionItemsPanel } from "@/components/dashboard/ActionItemsPanel";
import { ExecutiveBriefingPanel } from "@/components/dashboard/ExecutiveBriefingPanel";
import { MilestonesPanel } from "@/components/dashboard/MilestonesPanel";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getState } from "@/core/api";
import { buildDashboardInsights } from "@/core/dashboard-analytics";
import { formatCurrency, formatDate } from "@/core/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { engineers, opportunities, projects } = await getState();
  const { pipeline, delivery, team, actions, milestones } = buildDashboardInsights(
    engineers,
    opportunities,
    projects
  );

  const activeOpps = opportunities.filter((o) => !["won", "lost"].includes(o.stage));
  const pipelineValue = activeOpps.reduce((s, o) => s + o.value * (o.probability / 100), 0);
  const totalPipeline = activeOpps.reduce((s, o) => s + o.value, 0);
  const avgUtilization = engineers.length
    ? Math.round(engineers.reduce((s, e) => s + e.utilization, 0) / engineers.length)
    : 0;
  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "at_risk");

  const atRiskProjects = projects.filter((p) => p.status === "at_risk");
  const upcomingCloses = activeOpps
    .slice()
    .sort((a, b) => new Date(a.expectedClose).getTime() - new Date(b.expectedClose).getTime())
    .slice(0, 5);
  const engineerNames = Object.fromEntries(engineers.map((e) => [e.id, e.name]));

  return (
    <div>
      <Header title="Executive Dashboard" />

      <div className="space-y-6 p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Weighted Pipeline"
            value={formatCurrency(pipelineValue)}
            context={`${formatCurrency(totalPipeline)} unweighted · ${pipeline.closingWithin30Days} closing in 30d`}
            icon={DollarSign}
          />
          <KPICard
            label="Active Delivery"
            value={String(activeProjects.length)}
            context={`${delivery.planningCount} in planning · ${delivery.atRiskCount} at risk`}
            icon={FolderKanban}
          />
          <KPICard
            label="Budget Burn"
            value={`${delivery.burnPercent}%`}
            context={`${formatCurrency(delivery.totalSpent)} of ${formatCurrency(delivery.totalBudget)}`}
            icon={Flame}
          />
          <KPICard
            label="Team Utilization"
            value={`${avgUtilization}%`}
            context={`${team.overallocated.length} overallocated · ${team.benchCapacityPercent}% bench`}
            icon={Users}
          />
        </div>

        <ExecutiveBriefingPanel />

        <ActionItemsPanel items={actions} />

        <div className="grid gap-6 xl:grid-cols-2">
          <PipelineChart opportunities={opportunities} />
          <UtilizationChart engineers={engineers} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <UpcomingClosesPanel
            closes={upcomingCloses}
            closingValue={pipeline.closingValue30Days}
          />
          <MilestonesPanel milestones={milestones} />
        </div>

        {atRiskProjects.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="title-lg">Projects Needing Attention</h3>
              <Link href="/projects" className="link-subtle">
                All projects
              </Link>
            </div>
            <div className={atRiskProjects.length === 1 ? "grid gap-6" : "grid gap-6 md:grid-cols-2"}>
              {atRiskProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  engineerNames={engineerNames}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

interface UpcomingClose {
  id: string;
  title: string;
  client: string;
  stage: string;
  probability: number;
  value: number;
  expectedClose: string;
}

function UpcomingClosesPanel({
  closes,
  closingValue,
}: {
  closes: UpcomingClose[];
  closingValue: number;
}) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="title-lg">Upcoming Closes</h3>
          <p className="body">{formatCurrency(closingValue)} in next 30 days</p>
        </div>
        <Link href="/opportunities" className="link-subtle">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-outline-variant/40">
        {closes.map((opp) => (
          <li key={opp.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate title-sm">{opp.title}</p>
              <p className="mt-0.5 text-xs text-surface-on-variant">{opp.client}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="chip capitalize">{opp.stage}</span>
                <span className="text-[11px] tabular text-surface-on-variant/70">
                  {opp.probability}% probability
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="title-sm tabular">{formatCurrency(opp.value)}</p>
              <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] tabular text-surface-on-variant/70">
                <CalendarClock className="h-3 w-3" />
                {formatDate(opp.expectedClose)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
