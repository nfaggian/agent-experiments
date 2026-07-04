import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { UtilizationChart } from "@/components/dashboard/UtilizationChart";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getDatabase, getDashboardMetrics } from "@/core/store";
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

export default function DashboardPage() {
  const db = getDatabase();
  const metrics = getDashboardMetrics(db);

  const atRiskProjects = db.projects.filter((p) => p.status === "at_risk");
  const upcomingCloses = db.opportunities
    .filter((o) => !["won", "lost"].includes(o.stage))
    .sort(
      (a, b) =>
        new Date(a.expectedClose).getTime() - new Date(b.expectedClose).getTime()
    )
    .slice(0, 4);

  const engineerNames = Object.fromEntries(
    db.engineers.map((e) => [e.id, e.name])
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
            iconColor="bg-emerald-50 text-emerald-600"
          />
          <KPICard
            label="Active Opportunities"
            value={String(metrics.activeOpportunities)}
            change={8}
            changeLabel="vs last month"
            icon={Target}
            iconColor="bg-violet-50 text-violet-600"
          />
          <KPICard
            label="Active Projects"
            value={String(metrics.activeProjects)}
            icon={FolderKanban}
            iconColor="bg-blue-50 text-blue-600"
          />
          <KPICard
            label="Team Utilization"
            value={`${metrics.avgUtilization}%`}
            change={metrics.avgUtilization > 85 ? -3 : 5}
            changeLabel="avg across team"
            icon={Users}
            iconColor="bg-amber-50 text-amber-600"
          />
        </div>

        {metrics.atRiskProjects > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {metrics.atRiskProjects} project
                {metrics.atRiskProjects > 1 ? "s" : ""} at risk
              </p>
              <p className="text-sm text-red-600">
                Review flagged projects and reallocate resources as needed.
              </p>
            </div>
            <Link href="/projects" className="btn-secondary text-red-700">
              View Projects
            </Link>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <PipelineChart opportunities={db.opportunities} />
          <UtilizationChart engineers={db.engineers} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="card p-6 xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">Upcoming Closes</h3>
              <Link
                href="/opportunities"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingCloses.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-start justify-between gap-3 border-b border-surface-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {opp.title}
                    </p>
                    <p className="text-xs text-slate-500">{opp.client}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(opp.value)}
                    </p>
                    <p className="text-xs text-slate-400">
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
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all projects
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {(atRiskProjects.length > 0
                ? atRiskProjects
                : db.projects.filter((p) => p.status === "active").slice(0, 2)
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <TrendingUp className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Total Pipeline Value: {formatCurrency(metrics.totalPipeline)}
              </p>
              <p className="text-sm text-slate-500">
                {metrics.availableCapacity} engineers with capacity below 70% ·{" "}
                Last updated {formatDate(db.lastUpdated.split("T")[0])}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
