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
  if (utilization >= 60) return "bg-emerald-500";
  return "bg-blue-400";
}

export function getUtilizationTextColor(utilization: number): string {
  if (utilization >= 100) return "text-red-600";
  if (utilization >= 85) return "text-amber-600";
  if (utilization >= 60) return "text-emerald-600";
  return "text-blue-600";
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    allocated: "bg-blue-50 text-blue-700 ring-blue-600/20",
    overallocated: "bg-red-50 text-red-700 ring-red-600/20",
    planning: "bg-slate-50 text-slate-700 ring-slate-600/20",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    on_hold: "bg-amber-50 text-amber-700 ring-amber-600/20",
    at_risk: "bg-red-50 text-red-700 ring-red-600/20",
    completed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  };
  return colors[status] ?? "bg-slate-50 text-slate-700 ring-slate-600/20";
}
