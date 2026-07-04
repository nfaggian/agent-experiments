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

/** Google brand palette for charts and indicators */
export const GOOGLE_COLORS = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC04",
  green: "#34A853",
  gray: "#9AA0A6",
} as const;

export function getUtilizationColor(utilization: number): string {
  if (utilization >= 100) return "bg-google-red";
  if (utilization >= 85) return "bg-google-yellow";
  if (utilization >= 60) return "bg-google-blue";
  return "bg-google-green";
}

export function getUtilizationTextColor(utilization: number): string {
  if (utilization >= 100) return "text-google-red";
  if (utilization >= 85) return "text-[#B06000]";
  if (utilization >= 60) return "text-brand-600";
  return "text-google-green";
}

export function getUtilizationCellStyle(utilization: number): string {
  if (utilization >= 100) return "bg-red-50 text-google-red ring-google-red/30";
  if (utilization >= 85) return "bg-yellow-50 text-[#B06000] ring-google-yellow/40";
  if (utilization >= 60) return "bg-blue-50 text-brand-600 ring-google-blue/30";
  return "bg-green-50 text-google-green ring-google-green/30";
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-green-50 text-google-green ring-1 ring-inset ring-google-green/30",
    allocated: "bg-blue-50 text-brand-600 ring-1 ring-inset ring-google-blue/30",
    overallocated: "bg-red-50 text-google-red ring-1 ring-inset ring-google-red/30",
    planning: "bg-surface-container text-surface-on-variant ring-1 ring-inset ring-outline",
    active: "bg-blue-50 text-brand-600 ring-1 ring-inset ring-google-blue/30",
    on_hold: "bg-yellow-50 text-[#B06000] ring-1 ring-inset ring-google-yellow/40",
    at_risk: "bg-red-50 text-google-red ring-1 ring-inset ring-google-red/30",
    completed: "bg-green-50 text-google-green ring-1 ring-inset ring-google-green/30",
  };
  return colors[status] ?? "bg-surface-container text-surface-on-variant ring-1 ring-inset ring-outline";
}

export const CHART_TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "1px solid #DADCE0",
  backgroundColor: "#FFFFFF",
  color: "#202124",
  boxShadow: "0 1px 2px 0 rgb(60 64 67 / 0.3), 0 2px 6px 2px rgb(60 64 67 / 0.15)",
  fontSize: "13px",
} as const;

export const CHART_GRID = "#E8EAED";
export const CHART_TICK = "#5F6368";
