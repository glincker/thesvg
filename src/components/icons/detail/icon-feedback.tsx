"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { ArrowUpRight, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { withUtm } from "@/lib/external-link";

type Sentiment = "up" | "down";
type Tally = { up: number; down: number };

const REASONS = ["Outdated logo", "Wrong colors", "Missing variant", "Other"] as const;
type Reason = (typeof REASONS)[number];

const REVIEW_PROMPTED_KEY = "thesvg-review-prompted";
const PRODUCT_HUNT_REVIEW_URL =
  "https://www.producthunt.com/products/thesvg/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-thesvg";

function storageKey(slug: string) {
  return `thesvg-feedback-${slug}`;
}

function isTally(value: unknown): value is Tally {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { up?: unknown }).up === "number" &&
    typeof (value as { down?: unknown }).down === "number"
  );
}

/**
 * Fire-and-forget GA4 event, mirroring the safe-gtag pattern used for search
 * tracking in header.tsx - no shared helper since each call site only fires
 * one event shape.
 */
function gaFeedback(slug: string, sentiment: Sentiment, reason?: Reason) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (cmd: string, event: string, params: Record<string, unknown>) => void;
  };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", "icon_feedback", { icon_slug: slug, sentiment, reason });
}

function gaFeedbackReset(slug: string, previousSentiment: Sentiment) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (cmd: string, event: string, params: Record<string, unknown>) => void;
  };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", "icon_feedback_reset", { icon_slug: slug, previous_sentiment: previousSentiment });
}

function buildFeedbackIssueUrl(slug: string, title: string, reason: Reason): string {
  const params = new URLSearchParams({
    title: `[Icon Feedback] ${reason} - ${title}`,
    body: `## Icon Feedback

**Icon**: ${title} (\`${slug}\`)
**Page**: https://thesvg.org/icon/${slug}
**Reported issue**: ${reason}

<!-- Add any more detail below - screenshots, the correct color/logo, etc. -->
`,
    labels: "icon-update",
  });
  return `https://github.com/glincker/thesvg/issues/new?${params.toString()}`;
}

/**
 * One-click "was this icon helpful" widget, floating so it stays visible
 * regardless of scroll position instead of getting lost in the page's
 * content flow. No backend/DB - the vote is captured as a PostHog + GA4
 * event (source of truth for aggregation) and mirrored to localStorage only
 * to lock the UI after voting and survive repeat visits in the same browser.
 *
 * A downvote offers a quick reason, which opens a pre-filled GitHub issue -
 * turning "not helpful" into an actionable report instead of a silent stat.
 * An upvote (once, site-wide, not per icon) offers a Product Hunt review
 * link, the positive-sentiment equivalent.
 */
export function IconFeedback({ slug, title }: Readonly<{ slug: string; title: string }>) {
  const [voted, setVoted] = useState<Sentiment | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [pickingReason, setPickingReason] = useState(false);
  const [reasonPicked, setReasonPicked] = useState<Reason | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVoted(window.localStorage.getItem(storageKey(slug)) as Sentiment | null);
  }, [slug]);

  // Best-effort read of the last cron-generated stats snapshot. The file
  // won't exist until the first successful icon-stats-snapshot workflow
  // run, and most slugs won't have an entry yet either - both are
  // expected, not errors, so we just leave the tally at null.
  useEffect(() => {
    let cancelled = false;

    fetch("/data/icon-stats.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (cancelled || typeof data !== "object" || data === null) return;
        const feedback = (data as { feedback?: unknown }).feedback;
        if (typeof feedback !== "object" || feedback === null) return;
        const entry = (feedback as Record<string, unknown>)[slug];
        if (isTally(entry)) setTally(entry);
      })
      .catch(() => {
        // Missing file (404) or network hiccup - no tally to show.
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  function vote(sentiment: Sentiment) {
    if (voted) return;
    setVoted(sentiment);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(slug), sentiment);
    }
    posthog.capture("icon_feedback", { slug, sentiment, source: "detail_page" });
    gaFeedback(slug, sentiment);

    if (sentiment === "down") {
      setPickingReason(true);
      return;
    }

    if (typeof window !== "undefined" && !window.localStorage.getItem(REVIEW_PROMPTED_KEY)) {
      window.localStorage.setItem(REVIEW_PROMPTED_KEY, "1");
      setShowReviewPrompt(true);
    }
  }

  function pickReason(reason: Reason) {
    posthog.capture("icon_feedback_reason", { slug, reason, source: "detail_page" });
    gaFeedback(slug, "down", reason);
    setReasonPicked(reason);
    setPickingReason(false);
    window.open(withUtm(buildFeedbackIssueUrl(slug, title, reason), "icon_feedback"), "_blank", "noopener,noreferrer");
  }

  // Reset doesn't (and can't, without a backend) retract the original
  // capture event from PostHog - it just clears the local lock so the
  // person can vote again, and logs the retraction as its own event so
  // there's at least a record that the earlier vote was undone.
  function resetVote() {
    if (!voted) return;
    posthog.capture("icon_feedback_reset", { slug, previous_sentiment: voted, source: "detail_page" });
    gaFeedbackReset(slug, voted);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey(slug));
    }
    setVoted(null);
    setReasonPicked(null);
    setPickingReason(false);
  }

  const statusLabel = reasonPicked ? "Thanks - opened an issue" : voted ? "Thanks!" : "Helpful?";

  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex flex-col items-end gap-2",
        "bottom-[max(76px,calc(var(--safe-bottom)+76px))] lg:bottom-6",
      )}
    >
      {pickingReason && (
        <div className="surface-glass flex flex-col gap-1 rounded-2xl border border-border/40 p-2 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.45)] dark:border-white/[0.08]">
          <p className="px-1.5 pt-1 text-[11px] font-medium text-muted-foreground">
            What&apos;s wrong with it?
          </p>
          {REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => pickReason(reason)}
              className="rounded-lg px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
            >
              {reason}
            </button>
          ))}
        </div>
      )}

      {showReviewPrompt && (
        <a
          href={withUtm(PRODUCT_HUNT_REVIEW_URL, "icon_feedback")}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setShowReviewPrompt(false)}
          className="surface-glass flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-2 text-xs text-foreground shadow-[0_12px_36px_-12px_rgba(0,0,0,0.45)] transition-colors hover:bg-accent dark:border-white/[0.08]"
        >
          Glad it helped - leave a review?
          <ArrowUpRight className="h-3 w-3 opacity-60" />
        </a>
      )}

      <div className="surface-glass flex items-center gap-2 rounded-full border border-border/40 px-3 py-2 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.45),0_2px_8px_-2px_rgba(0,0,0,0.25)] dark:border-white/[0.08]">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {statusLabel}
        </span>
        {voted !== null && !pickingReason && (
          <button
            type="button"
            onClick={resetVote}
            aria-label="Reset your feedback"
            title="Reset your feedback"
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => vote("up")}
            disabled={voted !== null}
            aria-label="This icon is helpful"
            aria-pressed={voted === "up"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors",
              voted === "up" &&
                "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              voted === null &&
                "hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-600",
              voted !== null && voted !== "up" && "opacity-40",
            )}
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          {tally !== null && tally.up > 0 && (
            <span className="text-[10px] tabular-nums text-muted-foreground">{tally.up}</span>
          )}
          <button
            type="button"
            onClick={() => vote("down")}
            disabled={voted !== null}
            aria-label="This icon is not helpful"
            aria-pressed={voted === "down"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors",
              voted === "down" &&
                "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400",
              voted === null &&
                "hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-600",
              voted !== null && voted !== "down" && "opacity-40",
            )}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
          {tally !== null && tally.down > 0 && (
            <span className="text-[10px] tabular-nums text-muted-foreground">{tally.down}</span>
          )}
        </div>
      </div>
    </div>
  );
}
