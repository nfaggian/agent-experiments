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

      <div className="space-y-6 p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active Pipeline" value={formatCurrency(totalValue)} />
          <StatCard
            label="Weighted Value"
            value={formatCurrency(weightedValue)}
            valueClassName="text-accent-foreground"
          />
          <StatCard
            label="Won this cycle"
            value={`${wonOpps.length} · ${formatCurrency(wonValue)}`}
            valueClassName="text-emerald-400"
            leadingIcon={<Trophy className="h-3.5 w-3.5" />}
            trailing={
              lostCount > 0 ? (
                <span className="flex items-center gap-1 text-[11px] tabular text-surface-on-variant/70">
                  <XCircle className="h-3 w-3" />
                  {lostCount} lost
                </span>
              ) : null
            }
          />
        </div>

        <div className="segmented-control w-fit">
          <button
            type="button"
            onClick={() => setView("board")}
            className={cn("segmented-item", view === "board" && "segmented-item-active")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn("segmented-item", view === "list" && "segmented-item-active")}
          >
            <List className="h-3.5 w-3.5" />
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

function StatCard({
  label,
  value,
  valueClassName,
  leadingIcon,
  trailing,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-2 text-surface-on-variant">
        <div className="flex items-center gap-1.5">
          {leadingIcon}
          <p className="label">{label}</p>
        </div>
        {trailing}
      </div>
      <p className={cn("mt-2 metric-sm", valueClassName)}>{value}</p>
    </div>
  );
}
