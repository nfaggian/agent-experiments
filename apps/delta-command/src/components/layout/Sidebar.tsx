"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  FolderKanban,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/core/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Opportunities", href: "/opportunities", icon: Target },
  { name: "Team", href: "/team", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-border bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-surface-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900">Delta Command</h1>
          <p className="text-xs text-slate-500">Engineering Hub</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {item.name}
              {isActive && (
                <ChevronRight className="ml-auto h-4 w-4 text-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-border p-4">
        <div className="rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-200">
            Delta Engineering
          </p>
          <p className="mt-1 text-sm font-semibold">Q3 2026 Review</p>
          <p className="mt-2 text-xs text-brand-100">
            Leadership dashboard ready for weekly sync
          </p>
        </div>
      </div>
    </aside>
  );
}
