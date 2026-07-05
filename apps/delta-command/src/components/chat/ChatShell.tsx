"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";

import { Composer } from "@/components/chat/Composer";
import { Message } from "@/components/chat/Message";
import { PromptChips } from "@/components/chat/PromptChips";
import { postChat, type ChatTurn } from "@/core/api";
import {
  STARTER_PROMPTS,
  newMessageId,
  type ChatMessage,
} from "@/core/chat";

/** Speed of the client-side reveal animation, in characters per interval tick. */
const REVEAL_CHARS_PER_TICK = 6;
const REVEAL_INTERVAL_MS = 24;

/**
 * The top-level chat surface — owns the message thread, composer state, and
 * the client-side reveal animation for assistant replies.
 *
 * We intentionally keep the entire conversation in component state: threads
 * are session-scoped, no persistence, no multi-thread. That matches the
 * "ambient assistant" framing — every page load starts a fresh conversation.
 */
export function ChatShell() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<{ aborted: boolean } | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const send = useCallback(
    async (userContent: string) => {
      const trimmed = userContent.trim();
      if (!trimmed || loading) return;

      const userMessage: ChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      const nextHistory: ChatTurn[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: trimmed },
      ];

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setError(null);

      const abortToken = { aborted: false };
      abortRef.current = abortToken;

      try {
        const { reply } = await postChat(nextHistory);
        if (abortToken.aborted) return;
        await revealAssistantMessage(reply, setMessages, abortToken);
      } catch (err) {
        if (abortToken.aborted) return;
        setError(err instanceof Error ? err.message : "Chat request failed");
      } finally {
        if (!abortToken.aborted) setLoading(false);
      }
    },
    [loading, messages],
  );

  const handleStop = useCallback(() => {
    if (abortRef.current) abortRef.current.aborted = true;
    setLoading(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    );
  }, []);

  // Consume a ?prompt=... query param to auto-submit the first turn (used by
  // the dashboard's "Ask Delta" callout). We clear the param so a refresh
  // doesn't re-send.
  const initialPromptRef = useRef(false);
  useEffect(() => {
    if (initialPromptRef.current) return;
    const promptKey = searchParams.get("prompt");
    if (!promptKey) return;
    initialPromptRef.current = true;
    const starter = STARTER_PROMPTS.find((p) => p.id === promptKey);
    if (starter) {
      router.replace("/chat");
      void send(starter.prompt);
    }
  }, [router, searchParams, send]);

  const isEmpty = messages.length === 0 && !loading;
  const lastAssistantId = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.id,
    [messages],
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-2.5 md:px-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted text-[11px] font-semibold text-accent-foreground">
            Δ
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-surface-on">Delta</h2>
          <span className="text-[11px] text-surface-on-variant">
            grounded in live pipeline, team, and delivery data
          </span>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              handleStop();
              setMessages([]);
              setError(null);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-surface-on-variant transition-colors hover:bg-white/[0.04] hover:text-surface-on"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-8 md:px-8">
          {isEmpty ? (
            <EmptyState onSelect={(p) => void send(p)} />
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  pending={
                    loading &&
                    message.role === "assistant" &&
                    message.id === lastAssistantId &&
                    message.content.length === 0
                  }
                />
              ))}
              {loading && !lastAssistantId && <PendingRow />}
              {error && (
                <div className="banner-error text-sm">
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
          <div ref={scrollAnchorRef} />
        </div>
      </div>

      <div className="border-t border-white/[0.05] bg-surface/80 px-6 pb-6 pt-4 backdrop-blur-md md:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={() => void send(input)}
            onStop={handleStop}
            loading={loading}
            autoFocus
          />
          <p className="mt-2 text-center text-[11px] text-surface-on-variant/60">
            Delta reads live data on every turn; it may still be wrong. Verify before acting.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center pb-12">
      <div className="mb-8 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-accent-foreground">
          AI · Delta
        </span>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-surface-on">
        What do you need to know?
      </h1>
      <p className="mt-2 text-[15px] text-surface-on-variant">
        Ask about pipeline, capacity, or delivery. Answers use the current state
        of your dashboard.
      </p>
      <div className="mt-8">
        <PromptChips prompts={STARTER_PROMPTS} onSelect={onSelect} />
      </div>
    </div>
  );
}

function PendingRow() {
  return (
    <Message
      message={{
        id: "pending",
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      }}
      pending
    />
  );
}

/**
 * Reveal an assistant reply character-by-character on the client, so replies
 * feel streamed even when the underlying HTTP call was a single JSON response.
 *
 * The `abortToken` lets the caller (or the Stop button) short-circuit reveal.
 */
async function revealAssistantMessage(
  reply: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  abortToken: { aborted: boolean },
): Promise<void> {
  const id = newMessageId();
  setMessages((prev) => [
    ...prev,
    {
      id,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      streaming: true,
    },
  ]);

  return new Promise((resolve) => {
    let cursor = 0;
    const tick = () => {
      if (abortToken.aborted) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: reply, streaming: false } : m,
          ),
        );
        resolve();
        return;
      }
      cursor = Math.min(reply.length, cursor + REVEAL_CHARS_PER_TICK);
      const slice = reply.slice(0, cursor);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: slice } : m)),
      );
      if (cursor >= reply.length) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)),
        );
        resolve();
        return;
      }
      setTimeout(tick, REVEAL_INTERVAL_MS);
    };
    tick();
  });
}
