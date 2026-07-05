"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { TeamFilters, filterEngineers } from "@/components/team/TeamFilters";
import type { TeamFilterState } from "@/components/team/TeamFilters";
import { UtilizationTimelineView } from "@/components/team/UtilizationTimeline";
import type { Engineer, Project } from "@/core/types";
import { cn, formatNameList } from "@/core/utils";

interface TeamPageClientProps {
  engineers: Engineer[];
  projects: Project[];
}

export function TeamPageClient({ engineers: initial }: TeamPageClientProps) {
  const [engineers, setEngineers] = useState(initial);
  const [filters, setFilters] = useState<TeamFilterState>({ search: "", status: "all" });

  const filteredEngineers = useMemo(
    () => filterEngineers(engineers, filters),
    [engineers, filters]
  );

  const overallocated = engineers.filter((e) => e.status === "overallocated");
  const available = engineers.filter((e) => e.utilization < 70);
  const avgUtil = engineers.length
    ? Math.round(engineers.reduce((sum, e) => sum + e.utilization, 0) / engineers.length)
    : 0;

  return (
    <div>
      <Header
        title="Team Utilization"
        meta={`${engineers.length} engineers · click any week cell to edit`}
      />

      <div className="space-y-6 p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Team Members" value={engineers.length} tone="accent" />
          <StatCard icon={Clock} label="Avg This Week" value={`${avgUtil}%`} tone="blue" />
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
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm text-amber-100">
              <span className="font-medium text-amber-50">
                {formatNameList(overallocated.map((e) => e.name.split(" ")[0]))}
              </span>{" "}
              {overallocated.length === 1 ? "is" : "are"} overallocated this week.
            </p>
          </div>
        )}

        <TeamFilters
          filters={filters}
          onChange={setFilters}
          resultCount={filteredEngineers.length}
          totalCount={engineers.length}
        />

        <UtilizationTimelineView
          engineers={engineers}
          visibleEngineerIds={new Set(filteredEngineers.map((e) => e.id))}
          onDatabaseChange={(db) => setEngineers(db.engineers)}
        />
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
          <p className="metric-sm">{value}</p>
          <p className="label">{label}</p>
        </div>
      </div>
    </div>
  );
}
