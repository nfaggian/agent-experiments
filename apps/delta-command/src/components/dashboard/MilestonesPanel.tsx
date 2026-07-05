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
        <div>
          <h3 className="title-lg">Upcoming Milestones</h3>
          <p className="body">
            {milestones.length} in view
            {milestones.filter((m) => m.overdue).length > 0 &&
              ` · ${milestones.filter((m) => m.overdue).length} overdue`}
          </p>
        </div>
        <Link href="/projects" className="link-subtle">
          All projects
        </Link>
      </div>
      {milestones.length === 0 ? (
        <p className="text-sm text-surface-on-variant/70">No open milestones</p>
      ) : (
        <ul className="divide-y divide-outline-variant/40">
          {milestones.slice(0, 5).map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate title-sm">{m.title}</p>
                <p className="mt-0.5 truncate text-xs text-surface-on-variant">{m.projectName}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={cn(
                    "badge",
                    m.overdue
                      ? "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/25"
                      : m.daysUntil <= 7
                        ? "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25"
                        : "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25"
                  )}
                >
                  {m.overdue
                    ? `${Math.abs(m.daysUntil)}d overdue`
                    : m.daysUntil === 0
                      ? "Today"
                      : `${m.daysUntil}d`}
                </span>
                <p className="mt-1 text-[11px] tabular text-surface-on-variant/70">
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
