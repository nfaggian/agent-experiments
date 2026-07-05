import { ArrowRight } from "lucide-react";
import type { StarterPrompt } from "@/core/chat";

interface PromptChipsProps {
  prompts: StarterPrompt[];
  onSelect: (prompt: string) => void;
}

/**
 * Empty-state prompt tiles. Kept minimal — a title plus a one-line clarifier
 * so the user knows what tone of answer to expect.
 */
export function PromptChips({ prompts, onSelect }: PromptChipsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          type="button"
          onClick={() => onSelect(prompt.prompt)}
          className="group flex flex-col rounded-xl border border-white/[0.06] bg-surface-bright/60 p-4 text-left transition-colors duration-150 hover:border-white/[0.12] hover:bg-surface-bright"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="title-sm">{prompt.title}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-surface-on-variant/40 transition-colors group-hover:text-surface-on-variant" />
          </div>
          <span className="mt-1 text-xs text-surface-on-variant">{prompt.detail}</span>
        </button>
      ))}
    </div>
  );
}
