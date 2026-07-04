/**
 * API client for the Delta Command Python backend.
 *
 * On the server (Node.js runtime) we hit the backend directly at DELTA_API_URL.
 * In the browser we go through the Next.js rewrite at "/api/*" so requests
 * stay same-origin (see `next.config.ts`).
 */

import type {
  DashboardMetrics,
  Engineer,
  Opportunity,
  OpportunityStage,
  Project,
  ProjectStatus,
  UtilizationTimeline,
} from "./types";

const SERVER_API_BASE = process.env.DELTA_API_URL ?? "http://127.0.0.1:8000";

function apiUrl(path: string): string {
  return typeof window === "undefined" ? `${SERVER_API_BASE}${path}` : path;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`API ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>("/api/dashboard");
}

export async function getOpportunities(): Promise<Opportunity[]> {
  return apiFetch<Opportunity[]>("/api/opportunities");
}

export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

export async function getEngineers(): Promise<Engineer[]> {
  return apiFetch<Engineer[]>("/api/engineers");
}

export async function getUtilizationTimeline(): Promise<UtilizationTimeline> {
  return apiFetch<UtilizationTimeline>("/api/utilization/timeline");
}

export async function updateTimelineCell(
  engineerId: string,
  weekStart: string,
  utilization: number,
  note?: string
): Promise<UtilizationTimeline> {
  return apiFetch<UtilizationTimeline>("/api/utilization/timeline", {
    method: "PATCH",
    body: JSON.stringify({ engineerId, weekStart, utilization, note }),
  });
}

export async function updateOpportunityStage(
  id: string,
  stage: OpportunityStage
): Promise<Opportunity> {
  return apiFetch<Opportunity>("/api/opportunities", {
    method: "PATCH",
    body: JSON.stringify({ id, stage }),
  });
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });
}
