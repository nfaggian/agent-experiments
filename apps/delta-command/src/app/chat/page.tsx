import { Suspense } from "react";

import { ChatShell } from "@/components/chat/ChatShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chat · Delta Command",
  description: "Ask Delta about pipeline, capacity, and delivery.",
};

/**
 * Chat is a fully client-side surface — no server data fetched at page load,
 * the backend pulls the current state on every /api/chat call so the answer
 * is always current.
 *
 * Wrapped in <Suspense> so useSearchParams (needed for ?prompt=… deep-links)
 * doesn't bail out of static rendering.
 */
export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatShell />
    </Suspense>
  );
}
