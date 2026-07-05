"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import { updateTimelineCell } from "@/core/api";
import type { Database, Engineer } from "@/core/types";
import { cn, deriveTimelineWeeks, utilizationVariant } from "@/core/utils";

interface UtilizationTimelineProps {
  engineers: Engineer[];
  visibleEngineerIds?: Set<string>;
  onDatabaseChange?: (db: Database) => void;
}

export function UtilizationTimelineView({
  engineers,
  visibleEngineerIds,
  onDatabaseChange,
}: UtilizationTimelineProps) {
  const weeks = useMemo(() => deriveTimelineWeeks(engineers), [engineers]);
  const [editing, setEditing] = useState<{ engineerId: string; weekStart: string } | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (engineerId: string, weekStart: string, value: number) => {
    setEditing({ engineerId, weekStart });
    setDraftValue(String(value));
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraftValue("");
  };

  const saveEdit = useCallback(async () => {
    if (!editing) return;
    const utilization = Math.max(0, Math.min(150, parseInt(draftValue, 10) || 0));
    setSaving(true);
    try {
      const db = await updateTimelineCell(editing.engineerId, editing.weekStart, utilization);
      onDatabaseChange?.(db);
      setEditing(null);
      setDraftValue("");
    } finally {
      setSaving(false);
    }
  }, [draftValue, editing, onDatabaseChange]);

  const visibleEngineers = visibleEngineerIds
    ? engineers.filter((e) => visibleEngineerIds.has(e.id))
    : engineers;

  const rowAverage = (cells: { utilization: number }[]) =>
    cells.length ? Math.round(cells.reduce((s, c) => s + c.utilization, 0) / cells.length) : 0;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-outline-variant/40 px-6 py-4">
        <div>
          <h3 className="title-lg">Utilization Timeline</h3>
          <p className="body">
            Showing {visibleEngineers.length} of {engineers.length} — click any cell to edit
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] tabular text-surface-on-variant">
          <LegendSwatch className="bg-emerald-500" label="<60%" />
          <LegendSwatch className="bg-accent" label="60–84%" />
          <LegendSwatch className="bg-amber-500" label="85–99%" />
          <LegendSwatch className="bg-red-500" label="100%+" />
        </div>
      </div>

      <div className="max-h-[36rem] overflow-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-outline-variant/40 bg-surface-container-low">
              <th className="sticky left-0 z-10 min-w-[180px] bg-surface-container-low px-4 py-2.5 text-left label">
                Engineer
              </th>
              {weeks.map((week) => (
                <th
                  key={week.weekStart}
                  className={cn(
                    "min-w-[80px] px-2 py-2.5 text-center label",
                    week.isCurrent && "bg-accent-muted text-accent-foreground"
                  )}
                >
                  {week.label}
                  {week.isCurrent && (
                    <span className="ml-1 text-[9px] font-semibold uppercase tracking-wider text-accent-foreground/70">
                      now
                    </span>
                  )}
                </th>
              ))}
              <th className="min-w-[64px] px-3 py-2.5 text-center label">Avg</th>
            </tr>
          </thead>
          <tbody>
            {visibleEngineers.map((engineer) => (
              <tr
                key={engineer.id}
                className="border-b border-outline-variant/20 hover:bg-white/[0.015]"
              >
                <td className="sticky left-0 z-10 bg-surface-bright px-4 py-2">
                  <p className="title-sm leading-tight">{engineer.name}</p>
                  <p className="text-[11px] text-surface-on-variant">{engineer.role}</p>
                </td>
                {engineer.utilizationTimeline.map((cell) => {
                  const isEditing =
                    editing?.engineerId === engineer.id && editing.weekStart === cell.weekStart;
                  const weekMeta = weeks.find((w) => w.weekStart === cell.weekStart);
                  return (
                    <td
                      key={cell.weekStart}
                      className={cn(
                        "border-l border-outline-variant/20 px-1.5 py-1.5 text-center",
                        weekMeta?.isCurrent && "bg-accent-muted/20"
                      )}
                    >
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <input
                            type="number"
                            min={0}
                            max={150}
                            value={draftValue}
                            onChange={(e) => setDraftValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="h-8 w-12 rounded border border-accent/50 bg-surface-container px-1 text-center text-[13px] font-semibold tabular text-surface-on outline-none focus:ring-1 focus:ring-accent/60"
                            autoFocus
                            disabled={saving}
                          />
                          <button
                            type="button"
                            onClick={() => void saveEdit()}
                            className="flex h-6 w-6 items-center justify-center rounded text-accent-foreground hover:bg-white/[0.06]"
                            aria-label="Save"
                            disabled={saving}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex h-6 w-6 items-center justify-center rounded text-surface-on-variant hover:bg-white/[0.06]"
                            aria-label="Cancel"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(engineer.id, cell.weekStart, cell.utilization)}
                          className={cn("util-cell", utilizationVariant(cell.utilization).cell)}
                          title={cell.note ?? `Click to edit — ${cell.utilization}%`}
                        >
                          {cell.utilization}%
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className="border-l border-outline-variant/20 px-3 py-2 text-center">
                  <span
                    className={cn(
                      "text-[13px] font-semibold tabular",
                      utilizationVariant(rowAverage(engineer.utilizationTimeline)).text
                    )}
                  >
                    {rowAverage(engineer.utilizationTimeline)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-outline-variant/40 bg-surface-container-low">
              <td className="sticky left-0 z-10 bg-surface-container-low px-4 py-2.5 label">
                Team avg
              </td>
              {weeks.map((week, weekIndex) => {
                const values = visibleEngineers.map(
                  (e) => e.utilizationTimeline[weekIndex]?.utilization ?? 0
                );
                const avg = Math.round(values.reduce((s, v) => s + v, 0) / (values.length || 1));
                return (
                  <td
                    key={week.weekStart}
                    className={cn(
                      "border-l border-outline-variant/20 px-2 py-2.5 text-center",
                      week.isCurrent && "bg-accent-muted/20"
                    )}
                  >
                    <div className="mx-auto flex h-1.5 max-w-[60px] overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className={cn("h-full rounded-full", utilizationVariant(avg).bar)}
                        style={{ width: `${Math.min(avg, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] tabular text-surface-on-variant">{avg}%</p>
                  </td>
                );
              })}
              <td className="border-l border-outline-variant/20" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}
