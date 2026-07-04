"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  FolderKanban,
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
    <aside className="nav-drawer">
      <div className="flex h-[4.25rem] items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent shadow-glow">
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white">Delta Command</h1>
          <p className="text-[11px] text-sidebar-muted">Engineering Hub</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn("nav-item", isActive && "nav-item-active")}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-white" : "text-sidebar-muted"
                )}
                strokeWidth={isActive ? 2.25 : 2}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl border border-sidebar-border bg-white/[0.03] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
            Q3 Review
          </p>
          <p className="mt-1.5 text-sm font-medium text-white">Leadership sync</p>
          <p className="mt-1 text-xs leading-relaxed text-sidebar-muted">
            Pipeline, delivery & capacity
          </p>
        </div>
      </div>
    </aside>
  );
}
