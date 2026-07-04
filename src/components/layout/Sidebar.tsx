"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  FolderKanban,
  Bolt,
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
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container">
          <Bolt className="h-5 w-5 text-primary-on-container" />
        </div>
        <div>
          <h1 className="title-md text-surface-on">Delta Command</h1>
          <p className="label-md text-surface-on-variant">Engineering Hub</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        <p className="mb-2 px-4 label-md uppercase tracking-wider text-surface-on-variant/70">
          Navigation
        </p>
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
                  "h-6 w-6 shrink-0",
                  isActive ? "text-secondary-on-container" : "text-surface-on-variant"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-outline-variant/50 p-4">
        <div className="rounded-lg bg-primary-container p-4 shadow-elevation-1">
          <p className="label-md uppercase tracking-wider text-primary-on-container/70">
            Delta Engineering
          </p>
          <p className="mt-1 title-sm text-primary-on-container">Q3 2026 Review</p>
          <p className="mt-2 body-md text-primary-on-container/80">
            Leadership dashboard ready for weekly sync
          </p>
        </div>
      </div>
    </aside>
  );
}
