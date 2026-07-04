"use client";

import { Bell, Search } from "lucide-react";
import { format } from "date-fns";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="top-app-bar">
      <div>
        <h2 className="headline-md text-surface-on">{title}</h2>
        {subtitle && (
          <p className="body-md text-surface-on-variant">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden body-md text-surface-on-variant md:block">{today}</span>

        <div className="relative hidden md:block">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-on-variant" />
          <input
            type="text"
            placeholder="Search..."
            className="text-field-outlined h-12 w-64 pl-12"
          />
        </div>

        <button type="button" className="icon-btn" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-error-on">
            3
          </span>
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container title-sm text-primary-on-container">
          NF
        </div>
      </div>
    </header>
  );
}
