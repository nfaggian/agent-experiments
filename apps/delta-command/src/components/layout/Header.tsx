"use client";

import { Bell, Search } from "lucide-react";
import { format } from "date-fns";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const today = format(new Date(), "MMM d, yyyy");

  return (
    <header className="top-app-bar">
      <div>
        <h2 className="headline-md">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-surface-on-variant">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-xs font-medium text-surface-on-variant md:block">
          {today}
        </span>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-on-variant/60" />
          <input
            type="text"
            placeholder="Search..."
            className="text-field-outlined h-9 w-56 pl-9 text-sm"
          />
        </div>

        <button type="button" className="icon-btn" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error text-[9px] font-bold text-white">
            3
          </span>
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-xs font-semibold text-accent-foreground ring-1 ring-accent/30">
          NF
        </div>
      </div>
    </header>
  );
}
