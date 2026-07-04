import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { UtilizationChart } from "@/components/dashboard/UtilizationChart";
import { ActionItemsPanel } from "@/components/dashboard/ActionItemsPanel";
import {
  PipelineHealthPanel,
  MilestonesPanel,
} from "@/components/dashboard/PipelineHealthPanel";
import {
  DeliveryOverviewPanel,
  TeamSnapshotPanel,
} from "@/components/dashboard/DeliveryOverviewPanel";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getDashboardMetrics, getEngineers, getOpportunities, getProjects } from "@/core/api";
import { buildDashboardInsights } from "@/core/dashboard-analytics";
import { formatCurrency, formatDate } from "@/core/utils";
import {
  DollarSign,
  Target,
  FolderKanban,
  Users,
  Layers,
  Flame,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, engineers, opportunities, projects] = await Promise.all([
    getDashboardMetrics(),
    getEngineers(),
    getOpportunities(),
    getProjects(),
  ]);

  const insights = buildDashboardInsights(engineers, opportunities, projects);
  const { pipeline, delivery, team, actions, milestones } = insights;

  const atRiskProjects = projects.filter((p) => p.status === "at_risk");
  const upcomingCloses = opportunities
    .filter((o) => !["won", "lost"].includes(o.stage))
    .sort(
      (a, b) =>
        new Date(a.expectedClose).getTime() - new Date(b.expectedClose).getTime()
    )
    .slice(0, 5);

  const engineerNames = Object.fromEntries(
    engineers.map((e) => [e.id, e.name])
  );

  return (
    <div>
      <Header
        title="Executive Dashboard"
        subtitle="Pipeline, delivery, and capacity — updated for leadership sync"
      />

      <div className="space-y-8 p-8">
        {/* Primary KPIs — derived from live data */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <KPICard
            label="Weighted Pipeline"
            value={formatCurrency(metrics.pipelineValue)}
            context={`${formatCurrency(metrics.totalPipeline)} unweighted · ${pipeline.closingWithin30Days} closing in 30d`}
            icon={DollarSign}
            iconColor="bg-primary-container text-primary-on-container"
          />
          <KPICard
            label="Late-Stage Pipeline"
            value={String(pipeline.lateStage)}
            context={`${formatCurrency(pipeline.lateStageValue)} in proposal & negotiation`}
            icon={Layers}
            iconColor="bg-secondary-container text-secondary-on-container"
          />
          <KPICard
            label="In Negotiation"
            value={String(pipeline.inNegotiation)}
            context={`${formatCurrency(pipeline.negotiationValue)} · ${pipeline.avgProbability}% avg probability`}
            icon={Target}
            iconColor="bg-tertiary-container text-tertiary-on-container"
          />
          <KPICard
            label="Active Delivery"
            value={String(metrics.activeProjects)}
            context={`${delivery.planningCount} in planning · ${delivery.atRiskCount} at risk`}
            icon={FolderKanban}
            iconColor="bg-secondary-container text-secondary-on-container"
          />
          <KPICard
            label="Budget Burn"
            value={`${delivery.burnPercent}%`}
            context={`${formatCurrency(delivery.totalSpent)} of ${formatCurrency(delivery.totalBudget)} active budget`}
            icon={Flame}
            iconColor="bg-tertiary-container text-tertiary-on-container"
          />
          <KPICard
            label="Team Utilization"
            value={`${metrics.avgUtilization}%`}
            context={`${team.overallocated.length} overallocated · ${team.benchCapacityPercent}% bench capacity`}
            icon={Users}
            iconColor="bg-primary-container text-primary-on-container"
          />
        </div>

        {/* Prioritized actions */}
        <ActionItemsPanel items={actions} />

        {/* Charts */}
        <div className="grid gap-6 xl:grid-cols-2">
          <PipelineChart opportunities={opportunities} />
          <UtilizationChart engineers={engineers} />
        </div>

        {/* Insight panels */}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <PipelineHealthPanel pipeline={pipeline} />
          <MilestonesPanel milestones={milestones} />
          <TeamSnapshotPanel
            team={team}
            teamSize={metrics.teamSize}
            avgUtilization={metrics.avgUtilization}
          />
        </div>

        <DeliveryOverviewPanel delivery={delivery} />

        {/* Closes + projects */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="card p-6 xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="section-title">Upcoming Closes</h3>
                <p className="body-md text-surface-on-variant">
                  {formatCurrency(pipeline.closingValue30Days)} in next 30 days
                </p>
              </div>
              <Link
                href="/opportunities"
                className="label-md text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingCloses.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-start justify-between gap-3 border-b border-outline-variant/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate title-sm text-surface-on">
                      {opp.title}
                    </p>
                    <p className="label-md text-surface-on-variant">{opp.client}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="chip capitalize">{opp.stage}</span>
                      <span className="label-md text-surface-on-variant/70">
                        {opp.probability}%
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="title-sm text-surface-on">
                      {formatCurrency(opp.value)}
                    </p>
                    <p className="flex items-center justify-end gap-1 label-md text-surface-on-variant/70">
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(opp.expectedClose)}
                    </p>
                    <p className="label-md text-primary">
                      Wtd {formatCurrency(opp.value * (opp.probability / 100))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="section-title">Projects Needing Attention</h3>
                <p className="body-md text-surface-on-variant">
                  {atRiskProjects.length > 0
                    ? `${atRiskProjects.length} at risk · ${delivery.overdueMilestones} overdue milestones`
                    : "Active delivery status"}
                </p>
              </div>
              <Link
                href="/projects"
                className="label-md text-primary hover:underline"
              >
                View all projects
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {(atRiskProjects.length > 0
                ? atRiskProjects
                : projects.filter((p) => p.status === "active").slice(0, 2)
              ).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  engineerNames={engineerNames}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <p className="body-md text-surface-on-variant">
            Last updated {formatDate(metrics.lastUpdated.split("T")[0])} ·{" "}
            {metrics.teamSize} engineers · {metrics.activeOpportunities} active
            opportunities · {metrics.availableCapacity} with capacity below 70%
          </p>
        </div>
      </div>
    </div>
  );
}
