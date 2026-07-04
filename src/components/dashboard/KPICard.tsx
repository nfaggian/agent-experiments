import { cn } from "@/core/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

type AccentTone = "blue" | "violet" | "indigo" | "emerald" | "amber" | "red";

const ACCENT_STYLES: Record<AccentTone, string> = {
  blue: "bg-blue-500/15 text-blue-400",
  violet: "bg-violet-500/15 text-violet-400",
  indigo: "bg-indigo-500/15 text-indigo-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  amber: "bg-amber-500/15 text-amber-400",
  red: "bg-red-500/15 text-red-400",
};

interface KPICardProps {
  label: string;
  value: string;
  context?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  accent?: AccentTone;
}

export function KPICard({
  label,
  value,
  context,
  change,
  changeLabel,
  icon: Icon,
  accent = "blue",
}: KPICardProps) {
  const TrendIcon =
    change === undefined ? null : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const trendColor =
    change === undefined
      ? ""
      : change > 0
        ? "text-emerald-400"
        : change < 0
          ? "text-red-400"
          : "text-surface-on-variant";

  return (
    <div className="card group p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="metric-label">{label}</p>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105",
            ACCENT_STYLES[accent]
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>
      <p className="metric-value">{value}</p>
      {context && (
        <p className="mt-2 text-xs leading-relaxed text-surface-on-variant">{context}</p>
      )}
      {change !== undefined && TrendIcon && (
        <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          {changeLabel && (
            <span className="font-normal text-surface-on-variant/70">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
