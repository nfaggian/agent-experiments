"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Engineer, Project, ProjectStatus } from "@/core/types";
import { PROJECT_STATUSES } from "@/core/types";
import { updateProjectStatus } from "@/core/api";
import { formatCurrency, cn } from "@/core/utils";
import { FolderKanban, AlertTriangle, CheckCircle2, PauseCircle } from "lucide-react";

export function ProjectsPageClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [projectsRes, engineersRes] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/engineers"),
    ]);
    setProjects(await projectsRes.json());
    setEngineers(await engineersRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: string, status: ProjectStatus) => {
    await updateProjectStatus(id, status);
    await fetchData();
  };

  if (loading) {
    return (
      <div>
        <Header title="Active Projects" subtitle="Loading..." />
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-accent" />
        </div>
      </div>
    );
  }

  const engineerNames = Object.fromEntries(engineers.map((e) => [e.id, e.name]));
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

  const renderSection = (title: string, items: Project[]) =>
    items.length > 0 ? (
      <div>
        <h3 className="section-title mb-4">{title}</h3>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              engineerNames={engineerNames}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div>
      <Header
        title="Active Projects"
        subtitle="Monitor delivery progress, budgets, and milestones"
      />

      <div className="space-y-8 p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4">
            <p className="metric-label">Total Projects</p>
            <p className="metric-value text-[1.75rem]">{projects.length}</p>
          </div>
          <div className="card p-4">
            <p className="metric-label">In Delivery</p>
            <p className="metric-value text-[1.75rem] text-accent-foreground">
              {activeProjects.length + atRiskProjects.length}
            </p>
          </div>
          <div className="card p-4">
            <p className="metric-label">Total Budget</p>
            <p className="metric-value text-[1.75rem]">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="card p-4">
            <p className="metric-label">Spent to Date</p>
            <p className="metric-value text-[1.75rem] text-accent-foreground">
              {formatCurrency(totalSpent)}
            </p>
            <p className="label-md text-surface-on-variant/70">
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
                className="flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-bright px-4 py-2 shadow-card"
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", status.color)} />
                <Icon className="h-4 w-4 text-surface-on-variant" />
                <span className="title-sm text-surface-on">{status.label}</span>
                <span className="rounded-md bg-surface-container px-2 py-0.5 label-md text-surface-on-variant ring-1 ring-inset ring-outline-variant/60">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {atRiskProjects.length > 0 && (
          <div>
            <h3 className="section-title mb-4 flex items-center gap-2 text-error">
              <AlertTriangle className="h-5 w-5" />
              At Risk
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {atRiskProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  engineerNames={engineerNames}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        )}
        {renderSection("Active Delivery", activeProjects)}
        {renderSection("In Planning", planningProjects)}
      </div>
    </div>
  );
}
