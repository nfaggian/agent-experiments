import Link from "next/link";
import type { MilestoneItem } from "@/core/dashboard-analytics";
import type { PipelineInsight } from "@/core/dashboard-analytics";
import { formatCurrency, formatShortDate, cn } from "@/core/utils";
import { Handshake, Percent, CalendarClock, BarChart3 } from "lucide-react";

interface PipelineHealthPanelProps {
  pipeline: PipelineInsight;
}

export function PipelineHealthPanel({ pipeline }: PipelineHealthPanelProps) {
  const stats = [
    {
      icon: Percent,
      label: "Win rate",
      value: `${pipeline.winRate}%`,
      detail: `${pipeline.wonCount} won · ${pipeline.lostCount} lost`,
    },
    {
      icon: Handshake,
      label: "In negotiation",
      value: String(pipeline.inNegotiation),
      detail: formatCurrency(pipeline.negotiationValue),
    },
    {
      icon: CalendarClock,
      label: "Closing in 30d",
      value: String(pipeline.closingWithin30Days),
      detail: formatCurrency(pipeline.closingValue30Days),
    },
    {
      icon: BarChart3,
      label: "Avg deal / probability",
      value: formatCurrency(pipeline.avgDealSize),
      detail: `${pipeline.avgProbability}% avg probability`,
    },
  ];

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Pipeline Health</h3>
        <Link href="/opportunities" className="label-md text-primary hover:underline">
          View pipeline
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-surface-container-low p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <stat.icon className="h-4 w-4 text-primary" />
              <span className="label-md text-surface-on-variant">{stat.label}</span>
            </div>
            <p className="title-lg text-surface-on">{stat.value}</p>
            <p className="label-md text-surface-on-variant/70">{stat.detail}</p>
          </div>
        ))}
      </div>
      {pipeline.wonValue > 0 && (
        <p className="mt-4 body-md text-surface-on-variant">
          Won revenue to date:{" "}
          <span className="title-sm text-primary">{formatCurrency(pipeline.wonValue)}</span>
        </p>
      )}
    </div>
  );
}

interface MilestonesPanelProps {
  milestones: MilestoneItem[];
}

export function MilestonesPanel({ milestones }: MilestonesPanelProps) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Upcoming Milestones</h3>
        <Link href="/projects" className="label-md text-primary hover:underline">
          All projects
        </Link>
      </div>
      {milestones.length === 0 ? (
        <p className="body-md text-surface-on-variant/70">No open milestones</p>
      ) : (
        <ul className="space-y-3">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-start justify-between gap-3 border-b border-outline-variant/40 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate title-sm text-surface-on">{m.title}</p>
                <p className="truncate label-md text-surface-on-variant">
                  {m.projectName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={cn(
                    "badge",
                    m.overdue
                      ? "bg-error-container text-error-on-container"
                      : m.daysUntil <= 7
                        ? "bg-tertiary-container text-tertiary-on-container"
                        : "bg-secondary-container text-secondary-on-container"
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
