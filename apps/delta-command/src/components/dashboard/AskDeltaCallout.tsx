import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { STARTER_PROMPTS } from "@/core/chat";

/**
 * Dashboard entry point into the chat surface.
 *
 * Presents Delta (the assistant) as a conversational partner rather than a
 * one-shot briefing button. Each starter prompt deep-links into /chat with
 * ?prompt=<id>, which the ChatShell auto-submits as the first user turn.
 */
export function AskDeltaCallout() {
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-lg">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-accent-foreground">
              <Sparkles className="h-3 w-3" strokeWidth={2.25} />
              AI
            </span>
            <h3 className="title-lg">Ask Delta</h3>
          </div>
          <p className="body">
            Delta reads your live pipeline, team capacity, and delivery data.
            Ask for a briefing, dig into risks, or explore what-ifs.
          </p>
          <Link
            href="/chat"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-foreground transition-colors hover:text-accent"
          >
            Open chat
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ul className="grid flex-1 gap-2 md:max-w-md">
          {STARTER_PROMPTS.slice(0, 3).map((prompt) => (
            <li key={prompt.id}>
              <Link
                href={`/chat?prompt=${prompt.id}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-surface-container-low/40 px-3.5 py-2.5 transition-colors hover:border-white/[0.12] hover:bg-surface-container-low/70"
              >
                <div className="min-w-0">
                  <p className="truncate title-sm">{prompt.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-surface-on-variant">
                    {prompt.detail}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-surface-on-variant/40 transition-colors group-hover:text-surface-on-variant" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
