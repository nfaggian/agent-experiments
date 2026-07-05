/**
 * Chat message types and starter prompts for the conversational surface.
 *
 * The message id is client-side only — used as a React key and for anchoring
 * the streaming cursor. Backend never sees it.
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** Truthy while the client-side reveal animation is running. */
  streaming?: boolean;
}

/** Cheap, sortable-ish message id. */
export function newMessageId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface StarterPrompt {
  id: string;
  title: string;
  detail: string;
  prompt: string;
}

/**
 * The starter prompts shown on the empty state. Wording matches the language
 * an executive would actually use — no filler.
 */
export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: "briefing",
    title: "Today's executive briefing",
    detail: "Pipeline, capacity, delivery — one read.",
    prompt:
      "Write today's executive briefing covering pipeline health, team capacity, and delivery risks.",
  },
  {
    id: "overallocated",
    title: "Who's overallocated?",
    detail: "Names, percentages, and what they're on.",
    prompt:
      "Which engineers are overallocated this cycle? List each with their utilization and current projects.",
  },
  {
    id: "at-risk",
    title: "At-risk projects",
    detail: "Where delivery risk lives right now.",
    prompt:
      "Summarize the projects currently flagged at-risk, including budget burn and remaining milestones.",
  },
  {
    id: "closes",
    title: "Deals closing in the next 30 days",
    detail: "Late-stage pipeline with weighted value.",
    prompt:
      "Which opportunities are closing in the next 30 days? Include stage, weighted value, and probability.",
  },
];
