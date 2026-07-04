import { cn } from "@/core/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type AccentColor = "blue" | "red" | "yellow" | "green";

interface KPICardProps {
  label: string;
  value: string;
  context?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  accent?: AccentColor;
}

const accentClasses: Record<AccentColor, { bar: string; icon: string }> = {
  blue: {
    bar: "report-accent-blue",
    icon: "bg-blue-50 text-brand-600",
  },
  red: {
    bar: "report-accent-red",
    icon: "bg-red-50 text-google-red",
  },
  yellow: {
    bar: "report-accent-yellow",
    icon: "bg-yellow-50 text-[#B06000]",
  },
  green: {
    bar: "report-accent-green",
    icon: "bg-green-50 text-google-green",
  },
};

export function KPICard({
  label,
  value,
  context,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  accent = "blue",
}: KPICardProps) {
  const trendIcon =
    change === undefined ? null : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    change === undefined
      ? ""
      : change > 0
        ? "text-google-green"
        : change < 0
          ? "text-google-red"
          : "text-surface-on-variant";

  const accentStyle = accentClasses[accent];

  return (
    <div className={cn("card report-card-accent group p-5 pl-6", accentStyle.bar)}>
      <div className="mb-4 flex items-center justify-between">
        <p className="metric-label">{label}</p>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105",
            iconColor ?? accentStyle.icon
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
            <span className="font-normal text-surface-on-variant">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
