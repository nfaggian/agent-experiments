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
    <div className="card group p-4 transition-shadow hover:shadow-elevation-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="title-sm leading-snug text-surface-on">
          {opportunity.title}
        </h4>
        <span className="shrink-0 title-sm text-primary">
          {formatCurrency(opportunity.value)}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-1.5 label-md text-surface-on-variant">
        <Building2 className="h-3.5 w-3.5" />
        {opportunity.client}
      </div>

      {!compact && (
        <p className="mb-3 line-clamp-2 body-md text-surface-on-variant">
          {opportunity.description}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1">
        {opportunity.tags.map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between label-md">
          <span className="text-surface-on-variant">Probability</span>
          <span className="font-medium text-surface-on">
            {opportunity.probability}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-indicator"
            style={{ width: `${opportunity.probability}%` }}
          />
        </div>
        <p className="mt-1 label-sm text-surface-on-variant/70">
          Weighted: {formatCurrency(weightedValue)}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/50 pt-3 label-md text-surface-on-variant">
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
        <div className="mt-3 border-t border-outline-variant/50 pt-3">
          <select
            value={opportunity.stage}
            onChange={(e) =>
              onStageChange(opportunity.id, e.target.value as OpportunityStage)
            }
            className="text-field-outlined h-10 w-full text-label-md"
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
            className="flex w-72 shrink-0 flex-col rounded-lg bg-surface-container p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                <h3 className="title-sm text-surface-on">
                  {stage.label}
                </h3>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-bright px-1.5 label-md text-surface-on-variant shadow-elevation-1">
                  {stageOpps.length}
                </span>
              </div>
              <span className="label-md text-surface-on-variant">
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
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-outline-variant p-6">
                  <p className="label-md text-surface-on-variant/60">No opportunities</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
