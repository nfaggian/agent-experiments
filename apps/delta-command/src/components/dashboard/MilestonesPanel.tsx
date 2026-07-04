import Link from "next/link";
import type { MilestoneItem } from "@/core/dashboard-analytics";
import { cn, formatShortDate } from "@/core/utils";

interface MilestonesPanelProps {
  milestones: MilestoneItem[];
}

export function MilestonesPanel({ milestones }: MilestonesPanelProps) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Upcoming Milestones</h3>
        <Link href="/projects" className="link-subtle">
          All projects
        </Link>
      </div>
      {milestones.length === 0 ? (
        <p className="body-md text-surface-on-variant/70">No open milestones</p>
      ) : (
        <ul className="space-y-3">
          {milestones.slice(0, 5).map((m) => (
            <li
              key={m.id}
              className="flex items-start justify-between gap-3 border-b border-outline-variant/40 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate title-sm text-surface-on">{m.title}</p>
                <p className="truncate label-md text-surface-on-variant">{m.projectName}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={cn(
                    "badge",
                    m.overdue
                      ? "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30"
                      : m.daysUntil <= 7
                        ? "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30"
                  )}
                >
                  {m.overdue
                    ? `${Math.abs(m.daysUntil)}d overdue`
                    : m.daysUntil === 0
                      ? "Today"
                      : `${m.daysUntil}d`}
                </span>
                <p className="mt-1 label-md text-surface-on-variant/70">
                  {formatShortDate(m.dueDate)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
