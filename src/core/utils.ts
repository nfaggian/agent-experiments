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
  if (utilization >= 100) return "bg-error";
  if (utilization >= 85) return "bg-tertiary";
  if (utilization >= 60) return "bg-primary";
  return "bg-secondary";
}

export function getUtilizationTextColor(utilization: number): string {
  if (utilization >= 100) return "text-error";
  if (utilization >= 85) return "text-tertiary";
  if (utilization >= 60) return "text-primary";
  return "text-secondary";
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-primary-container text-primary-on-container",
    allocated: "bg-secondary-container text-secondary-on-container",
    overallocated: "bg-error-container text-error-on-container",
    planning: "bg-surface-container-highest text-surface-on-variant",
    active: "bg-primary-container text-primary-on-container",
    on_hold: "bg-tertiary-container text-tertiary-on-container",
    at_risk: "bg-error-container text-error-on-container",
    completed: "bg-secondary-container text-secondary-on-container",
  };
  return colors[status] ?? "bg-surface-container-highest text-surface-on-variant";
}
