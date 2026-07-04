"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { EngineerCard } from "@/components/team/EngineerCard";
import { TeamFilters, filterEngineers } from "@/components/team/TeamFilters";
import type { TeamFilterState } from "@/components/team/TeamFilters";
import { UtilizationTimelineView } from "@/components/team/UtilizationTimeline";
import type { Engineer, Project } from "@/core/types";
import { cn, formatNameList, utilizationVariant } from "@/core/utils";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  CalendarRange,
  LayoutGrid,
} from "lucide-react";

type TeamView = "timeline" | "overview";

interface TeamPageClientProps {
  engineers: Engineer[];
  projects: Project[];
}

export function TeamPageClient({ engineers: initial, projects }: TeamPageClientProps) {
  const [engineers, setEngineers] = useState(initial);
  const [view, setView] = useState<TeamView>("timeline");
  const [filters, setFilters] = useState<TeamFilterState>({ search: "", status: "all" });

  const projectNames = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const filteredEngineers = useMemo(
    () => filterEngineers(engineers, filters),
    [engineers, filters]
  );

  const overallocated = engineers.filter((e) => e.status === "overallocated");
  const available = engineers.filter((e) => e.utilization < 70);
  const avgUtil = engineers.length
    ? Math.round(engineers.reduce((sum, e) => sum + e.utilization, 0) / engineers.length)
    : 0;
  const sortedEngineers = [...filteredEngineers].sort((a, b) => b.utilization - a.utilization);

  return (
    <div>
      <Header
        title="Team Utilization"
        subtitle={`Plan and edit weekly capacity across ${engineers.length} delta engineers`}
      />

      <div className="space-y-8 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setView("timeline")}
              className={cn("segmented-item", view === "timeline" && "segmented-item-active")}
            >
              <CalendarRange className="h-4 w-4" />
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setView("overview")}
              className={cn("segmented-item", view === "overview" && "segmented-item-active")}
            >
              <LayoutGrid className="h-4 w-4" />
              Overview
            </button>
          </div>
          <p className="body-md text-surface-on-variant">
            {view === "timeline"
              ? "Click any week cell to update utilization — changes save to data.json"
              : "Current-week snapshot and team member details"}
          </p>
        </div>

        <TeamFilters
          filters={filters}
          onChange={setFilters}
          resultCount={filteredEngineers.length}
          totalCount={engineers.length}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Team Members" value={engineers.length} tone="accent" />
          <StatCard icon={Clock} label="This Week Avg" value={`${avgUtil}%`} tone="blue" />
          <StatCard
            icon={CheckCircle}
            label="Available Capacity"
            value={available.length}
            tone="emerald"
          />
          <StatCard
            icon={AlertTriangle}
            label="Overallocated"
            value={overallocated.length}
            tone="red"
          />
        </div>

        {overallocated.length > 0 && (
          <div className="banner-warning">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="body-md">
              <span className="title-sm">
                {formatNameList(overallocated.map((e) => e.name.split(" ")[0]))}
              </span>{" "}
              {overallocated.length === 1 ? "is" : "are"} overallocated this week. Adjust the timeline
              to plan redistribution.
            </p>
          </div>
        )}

        {view === "timeline" ? (
          <UtilizationTimelineView
            engineers={engineers}
            visibleEngineerIds={new Set(filteredEngineers.map((e) => e.id))}
            onDatabaseChange={(db) => setEngineers(db.engineers)}
          />
        ) : (
          <>
            <div className="card p-6">
              <h3 className="section-title mb-4">Current Week Capacity</h3>
              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {sortedEngineers.map((engineer) => (
                  <div key={engineer.id} className="flex items-center gap-4">
                    <span className="w-36 truncate title-sm text-surface-on">
                      {engineer.name.split(" ")[0]}
                    </span>
                    <div className="relative flex-1">
                      <div className="h-5 overflow-hidden rounded-full bg-surface-container-highest">
                        <div
                          className={cn(
                            "flex h-full items-center justify-end rounded-full pr-2 text-[10px] font-medium text-white transition-all",
                            utilizationVariant(engineer.utilization).bar
                          )}
                          style={{ width: `${Math.min(engineer.utilization, 100)}%` }}
                        >
                          {engineer.utilization >= 30 && `${engineer.utilization}%`}
                        </div>
                      </div>
                    </div>
                    <span className="w-20 text-right label-md text-surface-on-variant">
                      {engineer.currentProjects.length} proj
                    </span>
                  </div>
                ))}
                {sortedEngineers.length === 0 && (
                  <p className="body-md text-surface-on-variant">
                    No engineers match your filters.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="section-title mb-4">Team Members</h3>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sortedEngineers.map((engineer) => (
                  <EngineerCard
                    key={engineer.id}
                    engineer={engineer}
                    projectNames={projectNames}
                  />
                ))}
              </div>
              {sortedEngineers.length === 0 && (
                <p className="body-md text-surface-on-variant">
                  No engineers match your filters.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TONE_CLASSES = {
  accent: "bg-accent-muted text-accent-foreground",
  blue: "bg-blue-500/15 text-blue-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  red: "bg-red-500/15 text-red-400",
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="card p-5">
      <div className="stat-inline">
        <div className={cn("stat-icon", TONE_CLASSES[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="metric-value text-[1.75rem]">{value}</p>
          <p className="metric-label">{label}</p>
        </div>
      </div>
    </div>
  );
}
