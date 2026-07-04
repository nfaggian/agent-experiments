import { Header } from "@/components/layout/Header";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getEngineers, getProjects } from "@/core/api";
import { PROJECT_STATUSES } from "@/core/types";
import { formatCurrency, cn } from "@/core/utils";
import { FolderKanban, AlertTriangle, CheckCircle2, PauseCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, engineers] = await Promise.all([getProjects(), getEngineers()]);

  const engineerNames = Object.fromEntries(
    engineers.map((e) => [e.id, e.name])
  );

  const activeProjects = projects.filter((p) => p.status === "active");
  const atRiskProjects = projects.filter((p) => p.status === "at_risk");
  const planningProjects = projects.filter((p) => p.status === "planning");
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

  const statusIcons: Record<string, typeof FolderKanban> = {
    active: FolderKanban,
    at_risk: AlertTriangle,
    planning: PauseCircle,
    completed: CheckCircle2,
    on_hold: PauseCircle,
  };

  return (
    <div>
      <Header
        title="Active Projects"
        subtitle="Monitor delivery progress, budgets, and milestones"
      />

      <div className="space-y-8 p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs font-medium text-slate-500">Total Projects</p>
            <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-slate-500">In Delivery</p>
            <p className="text-2xl font-bold text-emerald-600">
              {activeProjects.length + atRiskProjects.length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-slate-500">Total Budget</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalBudget)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-slate-500">Spent to Date</p>
            <p className="text-2xl font-bold text-brand-600">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-slate-400">
              {Math.round((totalSpent / totalBudget) * 100)}% of total budget
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {PROJECT_STATUSES.map((status) => {
            const count = projects.filter((p) => p.status === status.id).length;
            const Icon = statusIcons[status.id] ?? FolderKanban;
            return (
              <div
                key={status.id}
                className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-4 py-2"
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", status.color)} />
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  {status.label}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {atRiskProjects.length > 0 && (
          <div>
            <h3 className="section-title mb-4 flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              At Risk
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {atRiskProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  engineerNames={engineerNames}
                />
              ))}
            </div>
          </div>
        )}

        {activeProjects.length > 0 && (
          <div>
            <h3 className="section-title mb-4">Active Delivery</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  engineerNames={engineerNames}
                />
              ))}
            </div>
          </div>
        )}

        {planningProjects.length > 0 && (
          <div>
            <h3 className="section-title mb-4">In Planning</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {planningProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  engineerNames={engineerNames}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
