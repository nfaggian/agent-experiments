"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";

import { generateBriefing } from "@/core/api";
import { cn } from "@/core/utils";

export function ExecutiveBriefingPanel() {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { briefing } = await generateBriefing();
      setBriefing(briefing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate briefing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-accent-foreground">
            <Sparkles className="h-3 w-3" strokeWidth={2.25} />
            AI
          </span>
          <h3 className="title-lg">Executive Briefing</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="btn-tonal"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          {briefing ? "Regenerate" : "Generate"}
        </button>
      </div>

      {error && (
        <div className="banner-error text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {briefing && (
        <div className="whitespace-pre-line text-[13.5px] leading-6 text-surface-on">{briefing}</div>
      )}

      {!briefing && !error && !loading && (
        <p className="text-sm text-surface-on-variant">
          Composed from live pipeline, capacity, and delivery data. Requires{" "}
          <code className="rounded bg-surface-container px-1.5 py-0.5 text-xs">LLM_API_KEY</code> on the backend.
        </p>
      )}

      {loading && !briefing && (
        <div className="flex items-center gap-2 text-sm text-surface-on-variant">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Composing briefing…
        </div>
      )}
    </div>
  );
}
