"use client";

import { Search } from "lucide-react";
import type { EngineerStatus } from "@/core/types";

export interface TeamFilterState {
  search: string;
  status: EngineerStatus | "all";
}

interface TeamFiltersProps {
  filters: TeamFilterState;
  onChange: (filters: TeamFilterState) => void;
  resultCount: number;
  totalCount: number;
}

const STATUS_OPTIONS: { value: TeamFilterState["status"]; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "allocated", label: "Allocated" },
  { value: "overallocated", label: "Overallocated" },
];

export function TeamFilters({ filters, onChange, resultCount, totalCount }: TeamFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-on-variant/60" />
        <input
          type="search"
          placeholder="Search engineers..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="text-field-outlined h-10 w-full pl-9 text-sm"
        />
      </div>
      <select
        value={filters.status}
        onChange={(e) =>
          onChange({ ...filters, status: e.target.value as TeamFilterState["status"] })
        }
        className="text-field-outlined h-10 min-w-[160px] px-3 text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="label-md text-surface-on-variant">
        {resultCount} of {totalCount} engineers
      </span>
    </div>
  );
}

export function filterEngineers<
  T extends { name: string; role: string; email: string; status: string }
>(engineers: T[], filters: TeamFilterState): T[] {
  const query = filters.search.trim().toLowerCase();
  return engineers.filter((engineer) => {
    if (filters.status !== "all" && engineer.status !== filters.status) return false;
    if (!query) return true;
    return (
      engineer.name.toLowerCase().includes(query) ||
      engineer.role.toLowerCase().includes(query) ||
      engineer.email.toLowerCase().includes(query)
    );
  });
}
