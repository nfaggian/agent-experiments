import { AlertTriangle, Calendar, CheckCircle2, ChevronDown, Circle, Users } from "lucide-react";

import type { Project } from "@/core/types";
import { PROJECT_STATUSES } from "@/core/types";
import {
  cn,
  daysUntil,
  formatCurrency,
  formatDate,
  getStatusBadgeColor,
} from "@/core/utils";

interface ProjectCardProps {
  project: Project;
  engineerNames?: Record<string, string>;
  onStatusChange?: (id: string, status: Project["status"]) => void;
}

export function ProjectCard({ project, engineerNames = {}, onStatusChange }: ProjectCardProps) {
  const statusConfig = PROJECT_STATUSES.find((s) => s.id === project.status);
  const daysLeft = daysUntil(project.endDate);
  const budgetUsed = Math.round((project.spent / project.budget) * 100);
  const teamNames = project.team.map((id) => engineerNames[id] ?? id);
  const completedMilestones = project.milestones.filter((m) => m.completed).length;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate title-md">{project.name}</h3>
          <p className="mt-0.5 text-xs text-surface-on-variant">{project.client}</p>
        </div>
        {onStatusChange ? (
          <StatusPicker
            projectId={project.id}
            currentStatus={project.status}
            onChange={onStatusChange}
          />
        ) : (
          <span className={cn("badge capitalize", getStatusBadgeColor(project.status))}>
            {statusConfig?.label ?? project.status}
          </span>
        )}
      </div>

      <div className="space-y-4 px-5 py-4">
        <p className="body">{project.description}</p>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider text-surface-on-variant">
              Progress
            </span>
            <span className="title-sm tabular">{project.progress}%</span>
          </div>
          <div className="progress-track h-1.5">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                project.status === "at_risk" ? "bg-red-500" : "bg-accent"
              )}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="label">Budget</dt>
            <dd className="mt-0.5 title-sm tabular">
              {formatCurrency(project.spent)}{" "}
              <span className="font-normal text-surface-on-variant/70">
                / {formatCurrency(project.budget)}
              </span>
            </dd>
            <dd
              className={cn(
                "text-[11px] tabular",
                budgetUsed > 90 ? "text-red-400" : "text-surface-on-variant/70"
              )}
            >
              {budgetUsed}% utilized
            </dd>
          </div>
          <div>
            <dt className="label">Timeline</dt>
            <dd className="mt-0.5 flex items-center gap-1 title-sm tabular">
              <Calendar className="h-3 w-3 text-surface-on-variant" />
              {daysLeft > 0 ? `${daysLeft}d remaining` : "Past due"}
            </dd>
            <dd className="text-[11px] tabular text-surface-on-variant/70">
              Due {formatDate(project.endDate)}
            </dd>
          </div>
        </dl>

        <div className="flex items-center gap-2 text-xs text-surface-on-variant tabular">
          <Users className="h-3.5 w-3.5" />
          <span>Lead</span>
          <span className="font-medium text-surface-on">{project.leadEngineer}</span>
          <span className="text-outline-variant">·</span>
          <span>{teamNames.length} team members</span>
        </div>

        {project.status === "at_risk" && (
          <div className="banner-warning text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>At-risk — review milestones and budget</span>
          </div>
        )}

        <div className="border-t border-outline-variant/40 pt-3">
          <p className="mb-2 label">
            Milestones{" "}
            <span className="text-surface-on-variant/60">
              ({completedMilestones}/{project.milestones.length})
            </span>
          </p>
          <ul className="space-y-1.5">
            {project.milestones.map((milestone) => (
              <li key={milestone.id} className="flex items-center gap-2 text-xs tabular">
                {milestone.completed ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-3 w-3 shrink-0 text-outline-variant" />
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

/**
 * Compact status picker rendered inline in the card header — an editable
 * badge, not a bulky select. Uses a native select for keyboard/a11y,
 * styled to match the read-only badge visually.
 */
function StatusPicker({
  projectId,
  currentStatus,
  onChange,
}: {
  projectId: string;
  currentStatus: Project["status"];
  onChange: (id: string, status: Project["status"]) => void;
}) {
  return (
    <label
      className={cn(
        "badge relative shrink-0 cursor-pointer gap-1 pr-1.5 capitalize",
        getStatusBadgeColor(currentStatus)
      )}
      title="Change status"
    >
      {PROJECT_STATUSES.find((s) => s.id === currentStatus)?.label ?? currentStatus}
      <ChevronDown className="h-3 w-3 opacity-70" strokeWidth={2.25} />
      <select
        value={currentStatus}
        onChange={(e) => onChange(projectId, e.target.value as Project["status"])}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Update project status"
      >
        {PROJECT_STATUSES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
