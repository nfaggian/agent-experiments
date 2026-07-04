import { cn } from "@/core/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function KPICard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "bg-primary-container text-primary-on-container",
}: KPICardProps) {
  const trendIcon =
    change === undefined ? null : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    change === undefined
      ? ""
      : change > 0
        ? "text-primary"
        : change < 0
          ? "text-error"
          : "text-surface-on-variant";

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {change !== undefined && TrendIcon && (
            <div className={cn("flex items-center gap-1 label-md", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-surface-on-variant/70">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            iconColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
