"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";

import { cn } from "@/core/utils";

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

/**
 * Multi-line composer with ⌘⏎ / ⌃⏎ submit, an inline send button, and a stop
 * button while a reply is in flight. Auto-grows up to 8 rows.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  loading = false,
  autoFocus = false,
  placeholder = "Ask about pipeline, capacity, or delivery…",
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled && !loading;

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isSubmit =
      event.key === "Enter" && (event.metaKey || event.ctrlKey);
    const isPlainEnter =
      event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey;
    if (isSubmit || isPlainEnter) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-surface-bright/95 shadow-elevation-2 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/30">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        className="block w-full resize-none bg-transparent px-4 pt-3.5 text-[14px] leading-6 text-surface-on outline-none placeholder:text-surface-on-variant/50"
      />
      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1">
        <span className="text-[11px] text-surface-on-variant/60">
          <kbd className="rounded border border-white/[0.06] bg-surface-container/60 px-1.5 py-0.5 font-sans text-[10px]">
            ⏎
          </kbd>{" "}
          send · <kbd className="rounded border border-white/[0.06] bg-surface-container/60 px-1.5 py-0.5 font-sans text-[10px]">Shift ⏎</kbd> newline
        </span>
        {loading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-surface-on transition-colors hover:bg-surface-container-high"
            aria-label="Stop"
          >
            <Square className="h-3 w-3 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSend}
            aria-label="Send"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              canSend
                ? "bg-accent text-white hover:bg-blue-400"
                : "bg-surface-container/60 text-surface-on-variant/50"
            )}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
