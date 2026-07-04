import { format } from "date-fns";

interface HeaderProps {
  title: string;
  meta?: string;
}

/**
 * The header is deliberately spartan: a page title, an optional meta line
 * (used to show a single actionable number), and today's date. Everything
 * else lives on the page itself so the chrome never competes with data.
 */
export function Header({ title, meta }: HeaderProps) {
  const today = format(new Date(), "MMM d, yyyy");

  return (
    <header className="top-app-bar">
      <div>
        <h2 className="headline-md">{title}</h2>
        {meta && <p className="mt-0.5 text-sm text-surface-on-variant">{meta}</p>}
      </div>
      <span className="text-xs font-medium text-surface-on-variant">{today}</span>
    </header>
  );
}
