import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d");
}

export function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date());
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getUtilizationColor(utilization: number): string {
  if (utilization >= 100) return "bg-red-500";
  if (utilization >= 85) return "bg-amber-500";
  if (utilization >= 60) return "bg-accent";
  return "bg-emerald-500";
}

export function getUtilizationTextColor(utilization: number): string {
  if (utilization >= 100) return "text-red-400";
  if (utilization >= 85) return "text-amber-400";
  if (utilization >= 60) return "text-accent-foreground";
  return "text-emerald-400";
}

export function getUtilizationCellStyle(utilization: number): string {
  if (utilization >= 100) return "bg-red-500/15 text-red-300 ring-red-500/30";
  if (utilization >= 85) return "bg-amber-500/15 text-amber-300 ring-amber-500/30";
  if (utilization >= 60) return "bg-blue-500/15 text-blue-300 ring-blue-500/30";
  return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
    allocated: "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/30",
    overallocated: "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30",
    planning: "bg-zinc-500/15 text-zinc-300 ring-1 ring-inset ring-zinc-500/30",
    active: "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/30",
    on_hold: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
    at_risk: "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30",
    completed: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  };
  return colors[status] ?? "bg-zinc-500/15 text-zinc-300 ring-1 ring-inset ring-zinc-500/30";
}

export const CHART_TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid rgb(255 255 255 / 0.08)",
  backgroundColor: "#18181B",
  color: "#FAFAFA",
  boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.6)",
  fontSize: "13px",
} as const;

export const CHART_GRID = "#27272A";
export const CHART_TICK = "#A1A1AA";
