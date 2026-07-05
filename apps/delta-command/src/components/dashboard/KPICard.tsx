import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  context?: string;
  icon: LucideIcon;
}

/**
 * Precision KPI card.
 *
 * - Fixed rhythm: label + value + context, stacked. No hover motion, no
 *   colored icon backgrounds (the icon is meta, the number is the message).
 * - Icon lives inline with the label so the eye reads label -> value -> context
 *   in a straight vertical line, uninterrupted.
 */
export function KPICard({ label, value, context, icon: Icon }: KPICardProps) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2 text-surface-on-variant">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        <p className="label">{label}</p>
      </div>
      <p className="metric">{value}</p>
      {context && (
        <p className="mt-2 text-xs leading-5 text-surface-on-variant tabular">{context}</p>
      )}
    </div>
  );
}
