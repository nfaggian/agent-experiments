/** API client for Delta Command Python backend. */

import type {
  DashboardMetrics,
  Database,
  Engineer,
  Opportunity,
  OpportunityStage,
  Project,
  ProjectStatus,
  UtilizationTimeline,
} from "./types";

const API_BASE = process.env.DELTA_API_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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

export async function getDatabase(): Promise<Database> {
  const [engineers, opportunities, projects, dashboard] = await Promise.all([
    getEngineers(),
    getOpportunities(),
    getProjects(),
    getDashboardMetrics(),
  ]);

  return {
    engineers,
    opportunities,
    projects,
    lastUpdated: dashboard.lastUpdated,
  };
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
