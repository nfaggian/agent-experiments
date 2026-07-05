"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Engineer, Project, ProjectStatus } from "@/core/types";
import { updateProjectStatus } from "@/core/api";
import { formatCurrency } from "@/core/utils";

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
  const burn = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const atRisk = byStatus("at_risk");
  const active = byStatus("active");
  const planning = byStatus("planning");
  const inDelivery = active.length + atRisk.length;

  return (
    <div>
      <Header
        title="Active Projects"
        meta={`${inDelivery} in delivery · ${planning.length} planning · ${atRisk.length} at risk`}
      />

      <div className="space-y-6 p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="label">Total Projects</p>
            <p className="mt-2 metric-sm tabular">{projects.length}</p>
          </div>
          <div className="card p-5">
            <p className="label">Budget</p>
            <p className="mt-2 metric-sm tabular">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="card p-5">
            <p className="label">Spent to Date</p>
            <p className="mt-2 metric-sm tabular text-accent-foreground">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-[11px] tabular text-surface-on-variant/70">
              {burn}% of budget
            </p>
          </div>
        </div>

        {atRisk.length > 0 && (
          <ProjectSection
            title="At Risk"
            titleIcon={<AlertTriangle className="h-4 w-4 text-red-400" />}
            titleClassName="text-red-300"
            projects={atRisk}
            engineerNames={engineerNames}
            onStatusChange={handleStatusChange}
          />
        )}
        <ProjectSection
          title="Active Delivery"
          projects={active}
          engineerNames={engineerNames}
          onStatusChange={handleStatusChange}
        />
        <ProjectSection
          title="In Planning"
          projects={planning}
          engineerNames={engineerNames}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}

function ProjectSection({
  title,
  titleIcon,
  titleClassName,
  projects,
  engineerNames,
  onStatusChange,
}: {
  title: string;
  titleIcon?: React.ReactNode;
  titleClassName?: string;
  projects: Project[];
  engineerNames: Record<string, string>;
  onStatusChange: (id: string, status: ProjectStatus) => void;
}) {
  if (projects.length === 0) return null;
  return (
    <section>
      <h3 className={`mb-3 flex items-center gap-2 title-lg ${titleClassName ?? ""}`}>
        {titleIcon}
        {title}
        <span className="ml-1 text-[11px] font-medium tabular text-surface-on-variant">
          {projects.length}
        </span>
      </h3>
      <div className={projects.length === 1 ? "grid gap-6" : "grid gap-6 md:grid-cols-2"}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            engineerNames={engineerNames}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </section>
  );
}
