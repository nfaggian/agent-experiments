"use client";

import { useCallback, useMemo, useState } from "react";
import type { Database, Engineer } from "@/core/types";
import { updateTimelineCell } from "@/core/api";
import { cn, deriveTimelineWeeks, utilizationVariant } from "@/core/utils";
import { CalendarRange, Check, Pencil, X } from "lucide-react";

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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/50 px-6 py-4">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-accent" />
            Utilization Timeline
          </h3>
          <p className="body-md text-surface-on-variant">
            Weekly capacity by engineer — click any cell to edit allocation
            <span className="ml-1 text-surface-on-variant/70">
              · showing {visibleEngineers.length} of {engineers.length}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 label-md text-surface-on-variant">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> &lt;60%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" /> 60–84%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 85–99%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> 100%+
          </span>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-outline-variant/50 bg-surface-container-low/95 backdrop-blur-sm">
              <th className="sticky left-0 z-10 min-w-[180px] bg-surface-container-low/95 px-4 py-3 text-left label-md text-surface-on-variant backdrop-blur-sm">
                Engineer
              </th>
              {weeks.map((week) => (
                <th
                  key={week.weekStart}
                  className={cn(
                    "min-w-[88px] px-2 py-3 text-center label-md",
                    week.isCurrent ? "bg-accent-muted text-accent-foreground" : "text-surface-on-variant"
                  )}
                >
                  <div>{week.label}</div>
                  {week.isCurrent && (
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      This week
                    </div>
                  )}
                </th>
              ))}
              <th className="min-w-[72px] px-3 py-3 text-center label-md text-surface-on-variant">
                Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleEngineers.map((engineer) => (
              <tr
                key={engineer.id}
                className="border-b border-outline-variant/30 hover:bg-surface-on/[0.02]"
              >
                <td className="sticky left-0 z-10 bg-surface-bright/95 px-4 py-3 backdrop-blur-sm">
                  <p className="title-sm text-surface-on">{engineer.name}</p>
                  <p className="label-md text-surface-on-variant">{engineer.role}</p>
                </td>
                {engineer.utilizationTimeline.map((cell) => {
                  const isEditing =
                    editing?.engineerId === engineer.id && editing.weekStart === cell.weekStart;
                  const weekMeta = weeks.find((w) => w.weekStart === cell.weekStart);
                  return (
                    <td
                      key={cell.weekStart}
                      className={cn("px-1 py-2 text-center", weekMeta?.isCurrent && "bg-accent-muted/30")}
                    >
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
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
                            className="text-field-outlined h-9 w-14 px-1 text-center text-sm"
                            autoFocus
                            disabled={saving}
                          />
                          <button
                            type="button"
                            onClick={() => void saveEdit()}
                            className="icon-btn h-8 w-8 text-accent-foreground"
                            aria-label="Save"
                            disabled={saving}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="icon-btn h-8 w-8"
                            aria-label="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(engineer.id, cell.weekStart, cell.utilization)}
                          className={cn(
                            "util-cell group relative",
                            utilizationVariant(cell.utilization).cell
                          )}
                          title={cell.note ?? `Click to edit — ${cell.utilization}%`}
                        >
                          <span className="title-sm">{cell.utilization}%</span>
                          <Pencil className="mt-0.5 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  <span
                    className={cn(
                      "title-sm",
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
            <tr className="bg-surface-container-low">
              <td className="sticky left-0 z-10 bg-surface-container-low/95 px-4 py-3 label-md font-medium text-surface-on-variant backdrop-blur-sm">
                Team average
              </td>
              {weeks.map((week, weekIndex) => {
                const values = visibleEngineers.map(
                  (e) => e.utilizationTimeline[weekIndex]?.utilization ?? 0
                );
                const avg = Math.round(values.reduce((s, v) => s + v, 0) / (values.length || 1));
                return (
                  <td
                    key={week.weekStart}
                    className={cn("px-2 py-3 text-center", week.isCurrent && "bg-accent-muted/40")}
                  >
                    <div className="mx-auto flex h-2 max-w-[72px] overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className={cn("h-full rounded-full", utilizationVariant(avg).bar)}
                        style={{ width: `${Math.min(avg, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 label-md text-surface-on-variant">{avg}%</p>
                  </td>
                );
              })}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
