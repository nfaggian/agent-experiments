"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { EngineerCard } from "@/components/team/EngineerCard";
import { UtilizationTimelineView } from "@/components/team/UtilizationTimeline";
import type { Engineer, Project, UtilizationTimeline } from "@/core/types";
import { cn, getUtilizationColor } from "@/core/utils";
import { Users, AlertTriangle, CheckCircle, Clock, CalendarRange, LayoutGrid } from "lucide-react";

type TeamView = "timeline" | "overview";

interface TeamPageClientProps {
  engineers: Engineer[];
  projects: Project[];
  timeline: UtilizationTimeline;
}

export function TeamPageClient({
  engineers,
  projects,
  timeline,
}: TeamPageClientProps) {
  const [view, setView] = useState<TeamView>("timeline");

  const projectNames = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const overallocated = engineers.filter((e) => e.status === "overallocated");
  const available = engineers.filter((e) => e.utilization < 70);
  const avgUtil = Math.round(
    engineers.reduce((sum, e) => sum + e.utilization, 0) / engineers.length
  );
  const sortedEngineers = [...engineers].sort((a, b) => b.utilization - a.utilization);

  return (
    <div>
      <Header
        title="Team Utilization"
        subtitle="Plan and edit weekly capacity across the delta engineering team"
      />

      <div className="space-y-8 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 rounded-full bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setView("timeline")}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                view === "timeline"
                  ? "bg-secondary-container text-secondary-on-container shadow-elevation-1"
                  : "text-surface-on-variant hover:bg-surface-on/[0.08]"
              )}
            >
              <CalendarRange className="h-4 w-4" />
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setView("overview")}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                view === "overview"
                  ? "bg-secondary-container text-secondary-on-container shadow-elevation-1"
                  : "text-surface-on-variant hover:bg-surface-on/[0.08]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Overview
            </button>
          </div>
          <p className="body-md text-surface-on-variant">
            {view === "timeline"
              ? "Click any week cell to update utilization — changes persist to config"
              : "Current-week snapshot and team member details"}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container">
                <Users className="h-5 w-5 text-primary-on-container" />
              </div>
              <div>
                <p className="metric-value text-[1.75rem]">{engineers.length}</p>
                <p className="metric-label">Team Members</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                <Clock className="h-5 w-5 text-tertiary-on-container" />
              </div>
              <div>
                <p className="metric-value text-[1.75rem]">{avgUtil}%</p>
                <p className="metric-label">This Week Avg</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
                <CheckCircle className="h-5 w-5 text-secondary-on-container" />
              </div>
              <div>
                <p className="metric-value text-[1.75rem]">{available.length}</p>
                <p className="metric-label">Available Capacity</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-container">
                <AlertTriangle className="h-5 w-5 text-error-on-container" />
              </div>
              <div>
                <p className="metric-value text-[1.75rem]">{overallocated.length}</p>
                <p className="metric-label">Overallocated</p>
              </div>
            </div>
          </div>
        </div>

        {overallocated.length > 0 && (
          <div className="banner-warning">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="body-md">
              <span className="title-sm">
                {overallocated.map((e) => e.name.split(" ")[0]).join(", ")}
              </span>{" "}
              {overallocated.length === 1 ? "is" : "are"} overallocated this week.
              Adjust the timeline to plan redistribution.
            </p>
          </div>
        )}

        {view === "timeline" ? (
          <UtilizationTimelineView initialData={timeline} />
        ) : (
          <>
            <div className="card p-6">
              <h3 className="section-title mb-4">Current Week Capacity</h3>
              <div className="space-y-3">
                {sortedEngineers.map((engineer) => (
                  <div key={engineer.id} className="flex items-center gap-4">
                    <span className="w-32 truncate title-sm text-surface-on">
                      {engineer.name.split(" ")[0]}
                    </span>
                    <div className="relative flex-1">
                      <div className="h-6 overflow-hidden rounded-full bg-surface-container-highest">
                        <div
                          className={cn(
                            "flex h-full items-center justify-end rounded-full pr-2 label-md font-medium text-white transition-all",
                            getUtilizationColor(engineer.utilization)
                          )}
                          style={{
                            width: `${Math.min(engineer.utilization, 100)}%`,
                          }}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
