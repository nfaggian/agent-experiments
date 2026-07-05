"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { MarkdownLite } from "@/components/chat/MarkdownLite";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import type { ChatMessage } from "@/core/chat";

interface MessageProps {
  message: ChatMessage;
  /** True when we're waiting on the model reply and this is the placeholder row. */
  pending?: boolean;
}

export function Message({ message, pending = false }: MessageProps) {
  if (message.role === "user") return <UserMessage content={message.content} />;
  return <AssistantMessage message={message} pending={pending} />;
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex animate-message-in justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-surface-container-low/70 px-4 py-2.5 text-[14px] leading-6 text-surface-on ring-1 ring-inset ring-white/[0.04]">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function AssistantMessage({ message, pending }: { message: ChatMessage; pending: boolean }) {
  return (
    <div className="flex animate-message-in gap-3">
      <AssistantMark />
      <div className="min-w-0 flex-1 pt-0.5">
        {pending ? (
          <div className="flex items-center gap-2 text-[13px] text-surface-on-variant">
            <TypingIndicator />
            <span>Analyzing pipeline, capacity, and delivery…</span>
          </div>
        ) : (
          <>
            <div className="relative">
              <MarkdownLite text={message.content} />
              {message.streaming && (
                <span
                  className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-caret-blink bg-accent align-middle"
                  aria-hidden
                />
              )}
            </div>
            {!message.streaming && <CopyButton text={message.content} />}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Small Δ mark to the left of assistant messages — signals "this came from the
 * AI" without a decorative avatar. The color changes ever so slightly on
 * hover to feel alive.
 */
function AssistantMark() {
  return (
    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-muted text-[11px] font-semibold text-accent-foreground">
      Δ
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permission denied — no-op
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-3 inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-surface-on-variant/70 transition-colors hover:bg-white/[0.04] hover:text-surface-on"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
