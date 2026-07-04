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
}

export function ProjectCard({ project, engineerNames = {} }: ProjectCardProps) {
  const statusConfig = PROJECT_STATUSES.find((s) => s.id === project.status);
  const daysLeft = daysUntil(project.endDate);
  const budgetUsed = Math.round((project.spent / project.budget) * 100);
  const teamNames = project.team.map((id) => engineerNames[id] ?? id);
  const completedMilestones = project.milestones.filter((m) => m.completed).length;

  return (
    <div className="card overflow-hidden transition-shadow hover:shadow-elevated">
      <div className="border-b border-surface-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">{project.name}</h3>
            <p className="text-sm text-slate-500">{project.client}</p>
          </div>
          <span className={cn("badge capitalize", getStatusBadgeColor(project.status))}>
            {statusConfig?.label ?? project.status}
          </span>
        </div>
      </div>

      <div className="px-6 py-4">
        <p className="mb-4 text-sm text-slate-600">{project.description}</p>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-slate-900">{project.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                project.status === "at_risk" ? "bg-red-500" : "bg-brand-500"
              )}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Budget</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
            </p>
            <p
              className={cn(
                "text-xs",
                budgetUsed > 90 ? "text-red-500" : "text-slate-400"
              )}
            >
              {budgetUsed}% utilized
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Timeline</p>
            <div className="flex items-center gap-1 text-sm font-semibold text-slate-900">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {daysLeft > 0 ? `${daysLeft}d remaining` : "Past due"}
            </div>
            <p className="text-xs text-slate-400">
              Due {formatDate(project.endDate)}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-500">Lead:</span>
          <span className="text-xs font-medium text-slate-700">
            {project.leadEngineer}
          </span>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs text-slate-500">
            {teamNames.length} team members
          </span>
        </div>

        {project.status === "at_risk" && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Project flagged as at-risk — review milestones and budget
          </div>
        )}

        <div className="border-t border-surface-border pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Milestones ({completedMilestones}/{project.milestones.length})
            </p>
          </div>
          <ul className="space-y-2">
            {project.milestones.map((milestone) => (
              <li key={milestone.id} className="flex items-center gap-2 text-xs">
                {milestone.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                )}
                <span
                  className={cn(
                    milestone.completed ? "text-slate-400 line-through" : "text-slate-700"
                  )}
                >
                  {milestone.title}
                </span>
                <span className="ml-auto text-slate-400">
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
