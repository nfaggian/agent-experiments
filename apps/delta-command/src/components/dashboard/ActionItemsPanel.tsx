import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowRight, Info } from "lucide-react";

import type { ActionItem, ActionSeverity } from "@/core/dashboard-analytics";
import { cn } from "@/core/utils";

const SEVERITY = {
  critical: {
    icon: AlertCircle,
    stripe: "before:bg-red-500",
    iconColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    stripe: "before:bg-amber-500",
    iconColor: "text-amber-400",
  },
  info: {
    icon: Info,
    stripe: "before:bg-blue-500",
    iconColor: "text-blue-400",
  },
} as const satisfies Record<ActionSeverity, { icon: typeof AlertCircle; stripe: string; iconColor: string }>;

interface ActionItemsPanelProps {
  items: ActionItem[];
}

export function ActionItemsPanel({ items }: ActionItemsPanelProps) {
  if (items.length === 0) return null;

  const critical = items.filter((i) => i.severity === "critical").length;
  const warning = items.filter((i) => i.severity === "warning").length;

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="title-lg">Action Required</h3>
        <p className="text-xs text-surface-on-variant tabular">
          {[
            critical > 0 && `${critical} critical`,
            warning > 0 && `${warning} warning`,
            critical === 0 && warning === 0 && `${items.length} items`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <ul className="divide-y divide-outline-variant/30 border-y border-outline-variant/30">
        {items.slice(0, 6).map((item) => {
          const config = SEVERITY[item.severity];
          const Icon = config.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 py-3 pl-4 pr-2 transition-colors duration-150",
                  "before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:content-['']",
                  "hover:bg-white/[0.02]",
                  config.stripe
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", config.iconColor)} strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="title-sm">{item.title}</p>
                  <p className="mt-0.5 text-xs text-surface-on-variant tabular">{item.detail}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-surface-on-variant/40 transition-colors group-hover:text-surface-on-variant" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
