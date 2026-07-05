"use client";

import { Building2, Calendar, User } from "lucide-react";

import type { Opportunity, OpportunityStage } from "@/core/types";
import { OPPORTUNITY_STAGES } from "@/core/types";
import { cn, formatCurrency, formatShortDate } from "@/core/utils";

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
    <div className="card-interactive p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="title-sm leading-snug">{opportunity.title}</h4>
        <span className="shrink-0 title-sm tabular text-accent-foreground">
          {formatCurrency(opportunity.value)}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-surface-on-variant">
        <Building2 className="h-3 w-3" />
        {opportunity.client}
      </div>

      {!compact && (
        <p className="mb-3 line-clamp-2 body">{opportunity.description}</p>
      )}

      {opportunity.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {opportunity.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mb-3">
        <div className="mb-1 flex items-baseline justify-between text-[11px] tabular text-surface-on-variant">
          <span>Probability</span>
          <span className="font-medium text-surface-on">{opportunity.probability}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-indicator"
            style={{ width: `${opportunity.probability}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] tabular text-surface-on-variant/70">
          Weighted {formatCurrency(weightedValue)}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/40 pt-2.5 text-[11px] tabular text-surface-on-variant">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {opportunity.owner.split(" ")[0]}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatShortDate(opportunity.expectedClose)}
        </span>
      </div>

      {onStageChange && (
        <select
          value={opportunity.stage}
          onChange={(e) => onStageChange(opportunity.id, e.target.value as OpportunityStage)}
          className="mt-3 h-8 w-full rounded-md border border-white/[0.06] bg-surface-container/60 px-2 text-[12px] font-medium text-surface-on outline-none transition-colors hover:border-white/[0.1] focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
        >
          {OPPORTUNITY_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

interface PipelineBoardProps {
  opportunities: Opportunity[];
  onStageChange?: (id: string, stage: OpportunityStage) => void;
}

export function PipelineBoard({ opportunities, onStageChange }: PipelineBoardProps) {
  const activeStages = OPPORTUNITY_STAGES.filter((s) => !["won", "lost"].includes(s.id));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {activeStages.map((stage) => {
        const stageOpps = opportunities.filter((o) => o.stage === stage.id);
        const stageValue = stageOpps.reduce((sum, o) => sum + o.value, 0);

        return (
          <div key={stage.id} className="kanban-column">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", stage.color)} />
                <h3 className="title-sm">{stage.label}</h3>
                <span className="rounded bg-surface-bright/80 px-1.5 text-[11px] font-medium tabular text-surface-on-variant ring-1 ring-inset ring-white/[0.06]">
                  {stageOpps.length}
                </span>
              </div>
              <span className="text-[11px] tabular text-surface-on-variant">
                {formatCurrency(stageValue)}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2.5">
              {stageOpps.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onStageChange={onStageChange}
                  compact
                />
              ))}
              {stageOpps.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-outline-variant/60 py-8">
                  <p className="text-[11px] uppercase tracking-wider text-surface-on-variant/50">
                    Empty
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
