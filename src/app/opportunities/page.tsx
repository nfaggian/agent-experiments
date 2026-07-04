"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { PipelineBoard } from "@/components/opportunities/PipelineBoard";
import { OpportunityCard } from "@/components/opportunities/PipelineBoard";
import type { Opportunity, OpportunityStage } from "@/core/types";
import { OPPORTUNITY_STAGES } from "@/core/types";
import { updateOpportunityStage } from "@/core/api";
import { formatCurrency, cn } from "@/core/utils";
import { LayoutGrid, List, Trophy, XCircle } from "lucide-react";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [view, setView] = useState<"board" | "list">("board");
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = useCallback(async () => {
    const res = await fetch("/api/opportunities");
    const data = await res.json();
    setOpportunities(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleStageChange = async (id: string, stage: OpportunityStage) => {
    await updateOpportunityStage(id, stage);
    await fetchOpportunities();
  };

  const activeOpps = opportunities.filter(
    (o) => !["won", "lost"].includes(o.stage)
  );
  const wonOpps = opportunities.filter((o) => o.stage === "won");
  const lostOpps = opportunities.filter((o) => o.stage === "lost");
  const totalValue = activeOpps.reduce((sum, o) => sum + o.value, 0);
  const weightedValue = activeOpps.reduce(
    (sum, o) => sum + o.value * (o.probability / 100),
    0
  );

  if (loading) {
    return (
      <div>
        <Header title="Opportunity Pipeline" subtitle="Loading..." />
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-accent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Opportunity Pipeline"
        subtitle="Track and manage the sales funnel from prospect to close"
      />

      <div className="space-y-6 p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4">
            <p className="metric-label">Active Pipeline</p>
            <p className="metric-value text-[1.75rem]">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="card p-4">
            <p className="metric-label">Weighted Value</p>
            <p className="metric-value text-[1.75rem] text-accent-foreground">
              {formatCurrency(weightedValue)}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-600" />
              <p className="metric-label">Won</p>
            </div>
            <p className="metric-value text-[1.75rem] text-emerald-600">
              {wonOpps.length} · {formatCurrency(wonOpps.reduce((s, o) => s + o.value, 0))}
            </p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-error" />
              <p className="metric-label">Lost</p>
            </div>
            <p className="metric-value text-[1.75rem] text-surface-on-variant">
              {lostOpps.length}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "segmented-item",
                view === "board" && "segmented-item-active"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "segmented-item",
                view === "list" && "segmented-item-active"
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          <div className="flex gap-3">
            {OPPORTUNITY_STAGES.filter((s) =>
              ["won", "lost"].includes(s.id)
            ).map((stage) => {
              const count = opportunities.filter((o) => o.stage === stage.id).length;
              return (
                <span
                  key={stage.id}
                  className="flex items-center gap-1.5 label-md text-surface-on-variant"
                >
                  <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                  {stage.label}: {count}
                </span>
              );
            })}
          </div>
        </div>

        {view === "board" ? (
          <PipelineBoard
            opportunities={opportunities}
            onStageChange={handleStageChange}
          />
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
