import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
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

export function formatNameList(names: string[], limit = 5): string {
  if (names.length <= limit) return names.join(", ");
  return `${names.slice(0, limit).join(", ")}, and ${names.length - limit} more`;
}

/**
 * Utilization bucket -> Tailwind classes for bar background, text color,
 * and cell (bg + text + ring) styling. Consolidates three previous helpers.
 */
interface UtilizationVariant {
  bar: string;
  text: string;
  cell: string;
}

const UTILIZATION_VARIANTS: UtilizationVariant[] = [
  // >= 100
  {
    bar: "bg-red-500",
    text: "text-red-400",
    cell: "bg-red-500/15 text-red-300 ring-red-500/30",
  },
  // >= 85
  {
    bar: "bg-amber-500",
    text: "text-amber-400",
    cell: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  },
  // >= 60
  {
    bar: "bg-accent",
    text: "text-accent-foreground",
    cell: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  },
  // < 60
  {
    bar: "bg-emerald-500",
    text: "text-emerald-400",
    cell: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  },
];

export function utilizationVariant(utilization: number): UtilizationVariant {
  if (utilization >= 100) return UTILIZATION_VARIANTS[0];
  if (utilization >= 85) return UTILIZATION_VARIANTS[1];
  if (utilization >= 60) return UTILIZATION_VARIANTS[2];
  return UTILIZATION_VARIANTS[3];
}

const STATUS_BADGE_COLORS: Record<string, string> = {
  available: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  allocated: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  overallocated: "bg-red-500/15 text-red-300 ring-red-500/30",
  planning: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  active: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  on_hold: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  at_risk: "bg-red-500/15 text-red-300 ring-red-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
};

export function getStatusBadgeColor(status: string): string {
  const cls = STATUS_BADGE_COLORS[status] ?? "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30";
  return `${cls} ring-1 ring-inset`;
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
