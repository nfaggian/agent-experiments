import type { Engineer } from "@/core/types";
import {
  cn,
  getInitials,
  getUtilizationColor,
  getUtilizationTextColor,
  getStatusBadgeColor,
} from "@/core/utils";
import { Mail, Briefcase } from "lucide-react";

interface EngineerCardProps {
  engineer: Engineer;
  projectNames?: Record<string, string>;
}

export function EngineerCard({ engineer, projectNames = {} }: EngineerCardProps) {
  const projects = engineer.currentProjects.map(
    (id) => projectNames[id] ?? id
  );

  return (
    <div className="card p-5 transition-shadow hover:shadow-elevated">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {getInitials(engineer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{engineer.name}</h3>
          <p className="text-sm text-slate-500">{engineer.role}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Mail className="h-3 w-3" />
            {engineer.email}
          </div>
        </div>
        <span className={cn("badge capitalize", getStatusBadgeColor(engineer.status))}>
          {engineer.status}
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Utilization</span>
          <span
            className={cn(
              "text-sm font-bold",
              getUtilizationTextColor(engineer.utilization)
            )}
          >
            {engineer.utilization}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              getUtilizationColor(engineer.utilization)
            )}
            style={{ width: `${Math.min(engineer.utilization, 100)}%` }}
          />
        </div>
        {engineer.utilization > 100 && (
          <p className="mt-1 text-xs text-red-500">
            {engineer.utilization - 100}% over capacity
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {engineer.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="border-t border-surface-border pt-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Briefcase className="h-3.5 w-3.5" />
          Current Projects ({projects.length})
        </div>
        {projects.length > 0 ? (
          <ul className="space-y-1">
            {projects.map((name) => (
              <li
                key={name}
                className="truncate text-xs text-slate-600 before:mr-1.5 before:text-slate-300 before:content-['•']"
              >
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">Available for assignment</p>
        )}
      </div>
    </div>
  );
}
