"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { withUtm } from "@/lib/external-link";
import { formatStarCount } from "@/lib/github-stars";
import { useGithubStars } from "@/lib/hooks/use-github-stars";
import { trackStarCta } from "@/lib/track-star-cta";
import {
  STAR_PROMPT_REPO_URL,
  STAR_PROMPT_STORAGE_KEY,
  shouldShowStarPrompt,
} from "@/lib/star-prompt";

const SHOW_DELAY_MS = 1500;

function readHandled(): boolean {
  try {
    return localStorage.getItem(STAR_PROMPT_STORAGE_KEY) === "1";
  } catch {
    // storage blocked: stay quiet rather than nag on every visit
    return true;
  }
}

function markHandled(): void {
  try {
    localStorage.setItem(STAR_PROMPT_STORAGE_KEY, "1");
  } catch {
    // storage blocked
  }
}

export function StarPrompt() {
  const copied = useRecentsStore((s) => s.copied);
  const [visible, setVisible] = useState(false);
  // Survives a failed storage write so closing never re-triggers the prompt.
  const [dismissed, setDismissed] = useState(false);
  const stars = useGithubStars(null);

  useEffect(() => {
    if (visible || dismissed || !shouldShowStarPrompt(copied, readHandled())) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [copied, visible, dismissed]);

  useEffect(() => {
    if (visible) trackStarCta("star_prompt", "viewed", stars);
    // Fire when the prompt appears, not again when the count refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const close = () => {
    markHandled();
    setDismissed(true);
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="fixed bottom-[calc(6rem+var(--safe-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl md:bottom-6 border border-border bg-card p-4 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
          <Star className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Finding thesvg useful?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {stars !== null
              ? `${formatStarCount(stars)} developers have starred it. A star helps others discover it.`
              : "A GitHub star helps other developers discover it. It is free and open source."}
          </p>
          <a
            href={withUtm(STAR_PROMPT_REPO_URL, "star_prompt")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackStarCta("star_prompt", "clicked", stars);
              close();
            }}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            Star on GitHub
          </a>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
