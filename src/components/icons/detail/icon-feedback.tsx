"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Sentiment = "up" | "down";

function storageKey(slug: string) {
  return `thesvg-feedback-${slug}`;
}

/**
 * Fire-and-forget GA4 event, mirroring the safe-gtag pattern used for search
 * tracking in header.tsx - no shared helper since each call site only fires
 * one event shape.
 */
function gaFeedback(slug: string, sentiment: Sentiment) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (cmd: string, event: string, params: Record<string, unknown>) => void;
  };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", "icon_feedback", { icon_slug: slug, sentiment });
}

/**
 * One-click "was this icon helpful" widget. No backend/DB - the vote is
 * captured as a PostHog + GA4 event (source of truth for aggregation) and
 * mirrored to localStorage only to lock the UI after voting and survive
 * repeat visits in the same browser.
 */
export function IconFeedback({ slug }: { slug: string }) {
  const [voted, setVoted] = useState<Sentiment | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVoted(window.localStorage.getItem(storageKey(slug)) as Sentiment | null);
  }, [slug]);

  function vote(sentiment: Sentiment) {
    if (voted) return;
    setVoted(sentiment);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(slug), sentiment);
    }
    posthog.capture("icon_feedback", { slug, sentiment, source: "detail_page" });
    gaFeedback(slug, sentiment);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 shadow-sm">
      <span className="text-xs text-muted-foreground">
        {voted ? "Thanks for the feedback!" : "Was this icon helpful?"}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => vote("up")}
          disabled={voted !== null}
          aria-label="This icon is helpful"
          aria-pressed={voted === "up"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors",
            voted === "up" &&
              "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            voted === null &&
              "hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-600",
            voted !== null && voted !== "up" && "opacity-40",
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => vote("down")}
          disabled={voted !== null}
          aria-label="This icon is not helpful"
          aria-pressed={voted === "down"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors",
            voted === "down" &&
              "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400",
            voted === null &&
              "hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-600",
            voted !== null && voted !== "down" && "opacity-40",
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
