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
    <div className="card p-5">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container title-sm text-primary-on-container">
          {getInitials(engineer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="title-sm text-surface-on">{engineer.name}</h3>
          <p className="body-md text-surface-on-variant">{engineer.role}</p>
          <div className="mt-1 flex items-center gap-1 label-md text-surface-on-variant/70">
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
          <span className="label-md text-surface-on-variant">Utilization</span>
          <span
            className={cn("title-sm", getUtilizationTextColor(engineer.utilization))}
          >
            {engineer.utilization}%
          </span>
        </div>
        <div className="progress-track h-2">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              getUtilizationColor(engineer.utilization)
            )}
            style={{ width: `${Math.min(engineer.utilization, 100)}%` }}
          />
        </div>
        {engineer.utilization > 100 && (
          <p className="mt-1 label-md text-error">
            {engineer.utilization - 100}% over capacity
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {engineer.skills.map((skill) => (
          <span key={skill} className="chip">
            {skill}
          </span>
        ))}
      </div>

      <div className="border-t border-outline-variant/50 pt-3">
        <div className="mb-2 flex items-center gap-1.5 label-md text-surface-on-variant">
          <Briefcase className="h-3.5 w-3.5" />
          Current Projects ({projects.length})
        </div>
        {projects.length > 0 ? (
          <ul className="space-y-1">
            {projects.map((name) => (
              <li
                key={name}
                className="truncate body-md text-surface-on-variant before:mr-1.5 before:text-outline-variant before:content-['•']"
              >
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="body-md text-surface-on-variant/60">Available for assignment</p>
        )}
      </div>
    </div>
  );
}
