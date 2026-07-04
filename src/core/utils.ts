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
  if (utilization >= 100) return "text-red-600";
  if (utilization >= 85) return "text-amber-600";
  if (utilization >= 60) return "text-accent-foreground";
  return "text-emerald-600";
}

export function getUtilizationCellStyle(utilization: number): string {
  if (utilization >= 100) return "bg-red-50 text-red-700 ring-red-200/80";
  if (utilization >= 85) return "bg-amber-50 text-amber-700 ring-amber-200/80";
  if (utilization >= 60) return "bg-blue-50 text-blue-700 ring-blue-200/80";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200/80";
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80",
    allocated: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/80",
    overallocated: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/80",
    planning: "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200/80",
    active: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/80",
    on_hold: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80",
    at_risk: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/80",
    completed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80",
  };
  return colors[status] ?? "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200/80";
}
