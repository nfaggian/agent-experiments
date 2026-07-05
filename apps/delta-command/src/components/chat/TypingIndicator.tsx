/**
 * Three-dot typing indicator shown while the assistant is "thinking".
 *
 * Uses CSS animation-delay to stagger, keeping the animation purely declarative.
 */
export function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Assistant is composing">
      <Dot delay="0ms" />
      <Dot delay="160ms" />
      <Dot delay="320ms" />
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-typing-dot rounded-full bg-surface-on-variant/70"
      style={{ animationDelay: delay }}
    />
  );
}
