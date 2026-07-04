import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { UtilizationChart } from "@/components/dashboard/UtilizationChart";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getDashboardMetrics, getEngineers, getOpportunities, getProjects } from "@/core/api";
import { formatCurrency, formatDate } from "@/core/utils";
import {
  DollarSign,
  Target,
  FolderKanban,
  Users,
  AlertTriangle,
  TrendingUp,
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

  const atRiskProjects = projects.filter((p) => p.status === "at_risk");
  const upcomingCloses = opportunities
    .filter((o) => !["won", "lost"].includes(o.stage))
    .sort(
      (a, b) =>
        new Date(a.expectedClose).getTime() - new Date(b.expectedClose).getTime()
    )
    .slice(0, 4);

  const engineerNames = Object.fromEntries(
    engineers.map((e) => [e.id, e.name])
  );

  return (
    <div>
      <Header
        title="Executive Dashboard"
        subtitle="Real-time view of pipeline, utilization, and delivery"
      />

      <div className="space-y-8 p-8">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Weighted Pipeline"
            value={formatCurrency(metrics.pipelineValue)}
            change={12}
            changeLabel="vs last month"
            icon={DollarSign}
            iconColor="bg-primary-container text-primary-on-container"
          />
          <KPICard
            label="Active Opportunities"
            value={String(metrics.activeOpportunities)}
            change={8}
            changeLabel="vs last month"
            icon={Target}
            iconColor="bg-tertiary-container text-tertiary-on-container"
          />
          <KPICard
            label="Active Projects"
            value={String(metrics.activeProjects)}
            icon={FolderKanban}
            iconColor="bg-secondary-container text-secondary-on-container"
          />
          <KPICard
            label="Team Utilization"
            value={`${metrics.avgUtilization}%`}
            change={metrics.avgUtilization > 85 ? -3 : 5}
            changeLabel="avg across team"
            icon={Users}
            iconColor="bg-primary-container text-primary-on-container"
          />
        </div>

        {metrics.atRiskProjects > 0 && (
          <div className="banner-error">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="title-sm">
                {metrics.atRiskProjects} project
                {metrics.atRiskProjects > 1 ? "s" : ""} at risk
              </p>
              <p className="body-md opacity-90">
                Review flagged projects and reallocate resources as needed.
              </p>
            </div>
            <Link href="/projects" className="btn-tonal">
              View Projects
            </Link>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <PipelineChart opportunities={opportunities} />
          <UtilizationChart engineers={engineers} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="card p-6 xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">Upcoming Closes</h3>
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
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="title-sm text-surface-on">
                      {formatCurrency(opp.value)}
                    </p>
                    <p className="label-md text-surface-on-variant/70">
                      {formatDate(opp.expectedClose)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">Projects Needing Attention</h3>
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container">
              <TrendingUp className="h-5 w-5 text-primary-on-container" />
            </div>
            <div>
              <p className="title-sm text-surface-on">
                Total Pipeline Value: {formatCurrency(metrics.totalPipeline)}
              </p>
              <p className="body-md text-surface-on-variant">
                {metrics.availableCapacity} engineers with capacity below 70% ·{" "}
                Last updated {formatDate(metrics.lastUpdated.split("T")[0])}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
