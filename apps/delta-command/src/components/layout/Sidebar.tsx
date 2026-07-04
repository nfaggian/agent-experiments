"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/core/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Opportunities", href: "/opportunities", icon: Target },
  { name: "Team", href: "/team", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
];

function GoogleLogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="nav-drawer">
      <div className="flex h-[4.25rem] items-center gap-2.5 border-b border-sidebar-border px-5">
        <GoogleLogoMark />
        <div>
          <h1 className="text-sm font-medium tracking-tight text-surface-on">Delta Command</h1>
          <p className="text-[11px] text-sidebar-muted">Engineering Reports</p>
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
                  isActive ? "text-brand-600" : "text-sidebar-muted"
                )}
                strokeWidth={isActive ? 2.25 : 2}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg border border-outline bg-brand-50/50 p-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-brand-600">
            Q3 Review
          </p>
          <p className="mt-1.5 text-sm font-medium text-surface-on">Leadership sync</p>
          <p className="mt-1 text-xs leading-relaxed text-sidebar-muted">
            Pipeline, delivery & capacity
          </p>
        </div>
      </div>
    </aside>
  );
}
