/**
 * API client for the Delta Command backend.
 *
 * On the server (Node.js) requests go directly to DELTA_API_URL.
 * In the browser they use the Next.js rewrite so requests stay same-origin.
 */

import type {
  Database,
  Opportunity,
  OpportunityStage,
  Project,
  ProjectStatus,
} from "./types";

const SERVER_API_BASE = process.env.DELTA_API_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = typeof window === "undefined" ? `${SERVER_API_BASE}${path}` : path;
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // response wasn't JSON; keep statusText
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

/** Fetch the entire database. Every page derives what it needs from this. */
export function getState(): Promise<Database> {
  return apiFetch<Database>("/api/state");
}

export function updateOpportunityStage(id: string, stage: OpportunityStage): Promise<Opportunity> {
  return apiFetch<Opportunity>("/api/opportunities", {
    method: "PATCH",
    body: JSON.stringify({ id, stage }),
  });
}

export function updateProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });
}

export function updateTimelineCell(
  engineerId: string,
  weekStart: string,
  utilization: number,
  note?: string
): Promise<Database> {
  return apiFetch<Database>("/api/timeline", {
    method: "PATCH",
    body: JSON.stringify({ engineerId, weekStart, utilization, note }),
  });
}

/** Ask the LLM to author an executive briefing from the current state. */
export function generateBriefing(): Promise<{ briefing: string }> {
  return apiFetch<{ briefing: string }>("/api/briefing", { method: "POST" });
}
