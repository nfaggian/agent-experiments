import type { Project } from "@/core/types";
import { PROJECT_STATUSES } from "@/core/types";
import {
  cn,
  formatCurrency,
  formatDate,
  daysUntil,
  getStatusBadgeColor,
} from "@/core/utils";
import { Calendar, Users, AlertTriangle, CheckCircle2, Circle } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  engineerNames?: Record<string, string>;
  onStatusChange?: (id: string, status: Project["status"]) => void;
}

export function ProjectCard({
  project,
  engineerNames = {},
  onStatusChange,
}: ProjectCardProps) {
  const statusConfig = PROJECT_STATUSES.find((s) => s.id === project.status);
  const daysLeft = daysUntil(project.endDate);
  const budgetUsed = Math.round((project.spent / project.budget) * 100);
  const teamNames = project.team.map((id) => engineerNames[id] ?? id);
  const completedMilestones = project.milestones.filter((m) => m.completed).length;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-outline-variant/50 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="title-sm text-surface-on">{project.name}</h3>
            <p className="body-md text-surface-on-variant">{project.client}</p>
          </div>
          <span className={cn("badge capitalize", getStatusBadgeColor(project.status))}>
            {statusConfig?.label ?? project.status}
          </span>
        </div>
      </div>

      <div className="px-6 py-4">
        <p className="mb-4 body-md text-surface-on-variant">{project.description}</p>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between body-md">
            <span className="text-surface-on-variant">Progress</span>
            <span className="title-sm text-surface-on">{project.progress}%</span>
          </div>
          <div className="progress-track h-2">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                project.status === "at_risk" ? "bg-red-500" : "bg-accent"
              )}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="label-md text-surface-on-variant">Budget</p>
            <p className="title-sm text-surface-on">
              {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
            </p>
            <p
              className={cn(
                "label-md",
                budgetUsed > 90 ? "text-error" : "text-surface-on-variant/70"
              )}
            >
              {budgetUsed}% utilized
            </p>
          </div>
          <div>
            <p className="label-md text-surface-on-variant">Timeline</p>
            <div className="flex items-center gap-1 title-sm text-surface-on">
              <Calendar className="h-3.5 w-3.5 text-surface-on-variant" />
              {daysLeft > 0 ? `${daysLeft}d remaining` : "Past due"}
            </div>
            <p className="label-md text-surface-on-variant/70">
              Due {formatDate(project.endDate)}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-surface-on-variant" />
          <span className="label-md text-surface-on-variant">Lead:</span>
          <span className="label-md font-medium text-surface-on">
            {project.leadEngineer}
          </span>
          <span className="label-md text-outline-variant">|</span>
          <span className="label-md text-surface-on-variant">
            {teamNames.length} team members
          </span>
        </div>

        {onStatusChange && (
          <div className="mb-4">
            <label className="mb-1.5 block label-md text-surface-on-variant">
              Update status
            </label>
            <select
              value={project.status}
              onChange={(e) =>
                onStatusChange(project.id, e.target.value as Project["status"])
              }
              className="text-field-outlined h-10 w-full text-sm"
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {project.status === "at_risk" && (
          <div className="banner-error mb-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="body-md">Project flagged as at-risk — review milestones and budget</span>
          </div>
        )}

        <div className="border-t border-outline-variant/50 pt-4">
          <p className="mb-2 label-md text-surface-on-variant">
            Milestones ({completedMilestones}/{project.milestones.length})
          </p>
          <ul className="space-y-2">
            {project.milestones.map((milestone) => (
              <li key={milestone.id} className="flex items-center gap-2 label-md">
                {milestone.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-outline-variant" />
                )}
                <span
                  className={cn(
                    milestone.completed
                      ? "text-surface-on-variant/60 line-through"
                      : "text-surface-on"
                  )}
                >
                  {milestone.title}
                </span>
                <span className="ml-auto text-surface-on-variant/70">
                  {formatDate(milestone.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
