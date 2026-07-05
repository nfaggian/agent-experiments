"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  MessageSquareText,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/core/utils";

const navigation = [
  { name: "Chat", href: "/chat", icon: MessageSquareText, isPrimary: true },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Opportunities", href: "/opportunities", icon: Target },
  { name: "Team", href: "/team", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="nav-drawer">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
          <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-[13px] font-semibold tracking-tight text-white">Delta Command</h1>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navigation.map((item, index) => {
          const isActive = pathname.startsWith(item.href);
          const isChat = item.isPrimary;
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={cn("nav-item", isActive && "nav-item-active")}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isChat
                      ? "text-accent"
                      : isActive
                        ? "text-surface-on"
                        : "text-sidebar-muted"
                  )}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {item.name}
                {isChat && (
                  <span className="ml-auto rounded bg-accent-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-foreground">
                    AI
                  </span>
                )}
              </Link>
              {isChat && index === 0 && (
                <div className="my-2 border-b border-sidebar-border/60" />
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
