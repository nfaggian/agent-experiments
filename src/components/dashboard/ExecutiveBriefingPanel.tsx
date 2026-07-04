"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
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
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            AI Executive Briefing
          </h3>
          <p className="body-md text-surface-on-variant">
            Leadership summary generated from live pipeline, delivery, and capacity data
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="btn-tonal shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          {briefing ? "Regenerate" : "Generate"}
        </button>
      </div>

      {error && (
        <div className="banner-error mb-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {briefing ? (
        <div className="whitespace-pre-line text-sm leading-relaxed text-surface-on">
          {briefing}
        </div>
      ) : (
        !error &&
        !loading && (
          <p className="body-md text-surface-on-variant/70">
            Click <span className="font-medium text-surface-on">Generate</span> to author a
            leadership-ready summary. Requires the backend to have{" "}
            <code className="rounded bg-surface-container px-1.5 py-0.5 text-xs">LLM_API_KEY</code>{" "}
            configured (any OpenAI-compatible provider).
          </p>
        )
      )}

      {loading && !briefing && (
        <div className="flex items-center gap-2 body-md text-surface-on-variant">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Composing briefing…
        </div>
      )}
    </div>
  );
}
