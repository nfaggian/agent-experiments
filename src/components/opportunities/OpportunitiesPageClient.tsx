"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Trophy, XCircle } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { PipelineBoard, OpportunityCard } from "@/components/opportunities/PipelineBoard";
import type { Opportunity, OpportunityStage } from "@/core/types";
import { updateOpportunityStage } from "@/core/api";
import { cn, formatCurrency } from "@/core/utils";

interface OpportunitiesPageClientProps {
  initialOpportunities: Opportunity[];
}

export function OpportunitiesPageClient({
  initialOpportunities,
}: OpportunitiesPageClientProps) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [view, setView] = useState<"board" | "list">("board");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleStageChange = async (id: string, stage: OpportunityStage) => {
    const updated = await updateOpportunityStage(id, stage);
    setOpportunities((prev) => prev.map((o) => (o.id === id ? updated : o)));
    startTransition(() => router.refresh());
  };

  const activeOpps = opportunities.filter((o) => !["won", "lost"].includes(o.stage));
  const wonOpps = opportunities.filter((o) => o.stage === "won");
  const lostCount = opportunities.filter((o) => o.stage === "lost").length;
  const totalValue = activeOpps.reduce((sum, o) => sum + o.value, 0);
  const weightedValue = activeOpps.reduce(
    (sum, o) => sum + o.value * (o.probability / 100),
    0
  );
  const wonValue = wonOpps.reduce((s, o) => s + o.value, 0);

  return (
    <div>
      <Header
        title="Opportunity Pipeline"
        meta={`${activeOpps.length} active · ${wonOpps.length} won · ${lostCount} lost`}
      />

      <div className="space-y-6 p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-4">
            <p className="metric-label">Active Pipeline</p>
            <p className="metric-value text-[1.75rem]">{formatCurrency(totalValue)}</p>
          </div>
          <div className="card p-4">
            <p className="metric-label">Weighted Value</p>
            <p className="metric-value text-[1.75rem] text-accent-foreground">
              {formatCurrency(weightedValue)}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-400" />
              <p className="metric-label">Won this cycle</p>
              {lostCount > 0 && (
                <span className="ml-auto flex items-center gap-1 label-md text-surface-on-variant/70">
                  <XCircle className="h-3.5 w-3.5" />
                  {lostCount} lost
                </span>
              )}
            </div>
            <p className="metric-value text-[1.75rem] text-emerald-400">
              {wonOpps.length} · {formatCurrency(wonValue)}
            </p>
          </div>
        </div>

        <div className="segmented-control w-fit">
          <button
            type="button"
            onClick={() => setView("board")}
            className={cn("segmented-item", view === "board" && "segmented-item-active")}
          >
            <LayoutGrid className="h-4 w-4" />
            Board
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn("segmented-item", view === "list" && "segmented-item-active")}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>

        {view === "board" ? (
          <PipelineBoard opportunities={opportunities} onStageChange={handleStageChange} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onStageChange={handleStageChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
