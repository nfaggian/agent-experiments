import Link from "next/link";
import type { DeliveryInsight, TeamInsight } from "@/core/dashboard-analytics";
import { formatCurrency, cn, getUtilizationTextColor } from "@/core/utils";
import { Users, Wallet, Clock, UserCheck } from "lucide-react";

interface DeliveryOverviewPanelProps {
  delivery: DeliveryInsight;
}

export function DeliveryOverviewPanel({ delivery }: DeliveryOverviewPanelProps) {
  const statusRows = [
    { label: "Active", count: delivery.activeCount, color: "bg-primary" },
    { label: "Planning", count: delivery.planningCount, color: "bg-outline" },
    { label: "At risk", count: delivery.atRiskCount, color: "bg-error" },
  ];
  const total = statusRows.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Delivery Overview</h3>
        <Link href="/projects" className="label-md text-primary hover:underline">
          View projects
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="label-md text-surface-on-variant">Budget burn</span>
          </div>
          <p className="title-lg text-surface-on">{delivery.burnPercent}%</p>
          <p className="label-md text-surface-on-variant/70">
            {formatCurrency(delivery.totalSpent)} of {formatCurrency(delivery.totalBudget)}
          </p>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="label-md text-surface-on-variant">Due soon</span>
          </div>
          <p className="title-lg text-surface-on">{delivery.milestonesDue14Days}</p>
          <p className="label-md text-surface-on-variant/70">
            milestones in 14 days
            {delivery.overdueMilestones > 0 &&
              ` · ${delivery.overdueMilestones} overdue`}
          </p>
        </div>
      </div>

      <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-surface-container-highest">
        {statusRows.map((row) =>
          row.count > 0 ? (
            <div
              key={row.label}
              className={cn("h-full", row.color)}
              style={{ width: `${(row.count / total) * 100}%` }}
              title={`${row.label}: ${row.count}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-3 label-md text-surface-on-variant">
        {statusRows.map((row) => (
          <span key={row.label} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", row.color)} />
            {row.label}: {row.count}
          </span>
        ))}
        {delivery.projectsEnding30Days > 0 && (
          <span className="text-tertiary">
            · {delivery.projectsEnding30Days} ending in 30d
          </span>
        )}
      </div>
    </div>
  );
}

interface TeamSnapshotPanelProps {
  team: TeamInsight;
  teamSize: number;
  avgUtilization: number;
}

export function TeamSnapshotPanel({
  team,
  teamSize,
  avgUtilization,
}: TeamSnapshotPanelProps) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Team Capacity</h3>
        <Link href="/team" className="label-md text-primary hover:underline">
          View team
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className={cn("title-lg", getUtilizationTextColor(avgUtilization))}>
            {avgUtilization}%
          </p>
          <p className="label-md text-surface-on-variant">Avg util</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="title-lg text-primary">{team.benchCapacityPercent}%</p>
          <p className="label-md text-surface-on-variant">Bench</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="title-lg text-surface-on">{team.available.length}</p>
          <p className="label-md text-surface-on-variant">Available</p>
        </div>
      </div>

      {team.overallocated.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 label-md text-error">Overallocated</p>
          <ul className="space-y-1">
            {team.overallocated.map((e) => (
              <li key={e.id} className="flex items-center justify-between body-md">
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-error" />
                  {e.name.split(" ")[0]}
                </span>
                <span className="label-md text-error">{e.utilization}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {team.unassigned.length > 0 && (
        <div>
          <p className="mb-2 label-md text-primary">Ready for assignment</p>
          <ul className="flex flex-wrap gap-2">
            {team.unassigned.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 label-md text-primary-on-container"
              >
                <UserCheck className="h-3.5 w-3.5" />
                {e.name.split(" ")[0]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {team.overallocated.length === 0 && team.unassigned.length === 0 && (
        <p className="body-md text-surface-on-variant/70">
          {teamSize} engineers actively allocated across delivery workstreams.
        </p>
      )}
    </div>
  );
}
