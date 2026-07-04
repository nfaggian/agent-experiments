import Link from "next/link";
import type { ActionItem, ActionSeverity } from "@/core/dashboard-analytics";
import { cn } from "@/core/utils";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowRight,
} from "lucide-react";

const severityStyles: Record<
  ActionSeverity,
  { container: string; icon: typeof AlertCircle }
> = {
  critical: {
    container: "border-error/30 bg-error-container/40",
    icon: AlertCircle,
  },
  warning: {
    container: "border-tertiary/30 bg-tertiary-container/40",
    icon: AlertTriangle,
  },
  info: {
    container: "border-primary/20 bg-primary-container/30",
    icon: Info,
  },
};

interface ActionItemsPanelProps {
  items: ActionItem[];
}

export function ActionItemsPanel({ items }: ActionItemsPanelProps) {
  if (items.length === 0) return null;

  const critical = items.filter((i) => i.severity === "critical").length;
  const warning = items.filter((i) => i.severity === "warning").length;

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="section-title">Action Required</h3>
          <p className="body-md text-surface-on-variant">
            {critical > 0 && `${critical} critical`}
            {critical > 0 && warning > 0 && " · "}
            {warning > 0 && `${warning} needs attention`}
            {critical === 0 && warning === 0 && `${items.length} items`}
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 6).map((item) => {
          const style = severityStyles[item.severity];
          const Icon = style.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border p-3 transition-shadow hover:shadow-elevation-1",
                  style.container
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="title-sm">{item.title}</p>
                  <p className="body-md opacity-80">{item.detail}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
