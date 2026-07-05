import { format } from "date-fns";

interface HeaderProps {
  title: string;
  meta?: string;
}

/**
 * Two-line header: page title (h2) and today's date. The optional `meta` slot
 * carries a single data-bearing summary; anything decorative goes on the page.
 */
export function Header({ title, meta }: HeaderProps) {
  const today = format(new Date(), "MMM d, yyyy");

  return (
    <header className="top-app-bar">
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-surface-on">{title}</h2>
        {meta && <p className="text-xs text-surface-on-variant">{meta}</p>}
      </div>
      <span className="text-xs font-medium text-surface-on-variant tabular">{today}</span>
    </header>
  );
}
