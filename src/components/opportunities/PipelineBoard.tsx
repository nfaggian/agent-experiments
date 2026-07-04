"use client";

import type { Opportunity, OpportunityStage } from "@/core/types";
import { OPPORTUNITY_STAGES } from "@/core/types";
import { formatCurrency, formatShortDate, cn } from "@/core/utils";
import { Building2, Calendar, User } from "lucide-react";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onStageChange?: (id: string, stage: OpportunityStage) => void;
  compact?: boolean;
}

export function OpportunityCard({
  opportunity,
  onStageChange,
  compact = false,
}: OpportunityCardProps) {
  const weightedValue = opportunity.value * (opportunity.probability / 100);

  return (
    <div className="group rounded-lg border border-surface-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-slate-900">
          {opportunity.title}
        </h4>
        <span className="shrink-0 text-sm font-bold text-brand-600">
          {formatCurrency(opportunity.value)}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
        <Building2 className="h-3.5 w-3.5" />
        {opportunity.client}
      </div>

      {!compact && (
        <p className="mb-3 line-clamp-2 text-xs text-slate-500">
          {opportunity.description}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1">
        {opportunity.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-500">Probability</span>
          <span className="font-medium text-slate-700">
            {opportunity.probability}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${opportunity.probability}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          Weighted: {formatCurrency(weightedValue)}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-surface-border pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {opportunity.owner.split(" ")[0]}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatShortDate(opportunity.expectedClose)}
        </div>
      </div>

      {onStageChange && (
        <div className="mt-3 border-t border-surface-border pt-3">
          <select
            value={opportunity.stage}
            onChange={(e) =>
              onStageChange(opportunity.id, e.target.value as OpportunityStage)
            }
            className="w-full rounded-md border border-surface-border bg-slate-50 px-2 py-1.5 text-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {OPPORTUNITY_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

interface PipelineBoardProps {
  opportunities: Opportunity[];
  onStageChange?: (id: string, stage: OpportunityStage) => void;
}

export function PipelineBoard({ opportunities, onStageChange }: PipelineBoardProps) {
  const activeStages = OPPORTUNITY_STAGES.filter(
    (s) => !["won", "lost"].includes(s.id)
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {activeStages.map((stage) => {
        const stageOpps = opportunities.filter((o) => o.stage === stage.id);
        const stageValue = stageOpps.reduce((sum, o) => sum + o.value, 0);

        return (
          <div
            key={stage.id}
            className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100/80 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                <h3 className="text-sm font-semibold text-slate-700">
                  {stage.label}
                </h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-slate-600 shadow-sm">
                  {stageOpps.length}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {formatCurrency(stageValue)}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {stageOpps.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onStageChange={onStageChange}
                  compact
                />
              ))}
              {stageOpps.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-6">
                  <p className="text-xs text-slate-400">No opportunities</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
