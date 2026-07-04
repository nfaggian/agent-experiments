"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Engineer, Project, ProjectStatus } from "@/core/types";
import { PROJECT_STATUSES } from "@/core/types";
import { updateProjectStatus } from "@/core/api";
import { cn, formatCurrency } from "@/core/utils";
import { FolderKanban, AlertTriangle, CheckCircle2, PauseCircle } from "lucide-react";

const STATUS_ICONS = {
  active: FolderKanban,
  at_risk: AlertTriangle,
  planning: PauseCircle,
  completed: CheckCircle2,
  on_hold: PauseCircle,
} as const;

interface ProjectsPageClientProps {
  initialProjects: Project[];
  engineers: Engineer[];
}

export function ProjectsPageClient({
  initialProjects,
  engineers,
}: ProjectsPageClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleStatusChange = async (id: string, status: ProjectStatus) => {
    const updated = await updateProjectStatus(id, status);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    startTransition(() => router.refresh());
  };

  const engineerNames = Object.fromEntries(engineers.map((e) => [e.id, e.name]));
  const byStatus = (s: ProjectStatus) => projects.filter((p) => p.status === s);
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

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

  const atRisk = byStatus("at_risk");
  const active = byStatus("active");
  const planning = byStatus("planning");
  const inDelivery = active.length + atRisk.length;

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
              {inDelivery}
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
              {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of total budget
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {PROJECT_STATUSES.map((status) => {
            const count = byStatus(status.id).length;
            const Icon = STATUS_ICONS[status.id] ?? FolderKanban;
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

        {atRisk.length > 0 && (
          <div>
            <h3 className="section-title mb-4 flex items-center gap-2 text-error">
              <AlertTriangle className="h-5 w-5" />
              At Risk
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {atRisk.map((project) => (
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
        {renderSection("Active Delivery", active)}
        {renderSection("In Planning", planning)}
      </div>
    </div>
  );
}
