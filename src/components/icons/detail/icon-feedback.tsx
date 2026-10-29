"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { ArrowUpRight, RotateCcw, ThumbsDown, ThumbsUp } from "@/components/own-icons";
import { cn } from "@/lib/utils";
import { withUtm } from "@/lib/external-link";
import { usePrefersReducedMotion } from "@/lib/hooks/use-media-query";

// Presentation-only timing for the label/pill fade sequence below. Kept in
// sync with the `duration-200` Tailwind class used on both elements so the
// "next tick" flips genuinely land after the fade-out has painted.
const FADE_MS = 200;
const HOLD_MS = 1000;

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
  const prefersReducedMotion = usePrefersReducedMotion();

  const [voted, setVoted] = useState<Sentiment | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [pickingReason, setPickingReason] = useState(false);
  const [reasonPicked, setReasonPicked] = useState<Reason | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  // Presentation-only sequencing state, layered on top of the vote state
  // machine above. `displayedLabel`/`labelVisible` control what text the
  // status label shows and whether it's faded in or out; `pillVisible`
  // does the same for the review-prompt pill once it mounts. None of this
  // feeds back into the capture logic - it only decides when things fade.
  const [displayedLabel, setDisplayedLabel] = useState("Helpful?");
  const [labelVisible, setLabelVisible] = useState(true);
  const [pillVisible, setPillVisible] = useState(false);

  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  function schedule(fn: () => void, delayMs: number) {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, delayMs);
    timersRef.current.push(id);
  }

  function clearScheduled() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  // Fades the status label to a new resting piece of text. Reduced-motion
  // users get the end state immediately, no transition, no delay.
  function showLabel(text: string) {
    if (prefersReducedMotion) {
      setDisplayedLabel(text);
      setLabelVisible(true);
      return;
    }
    setDisplayedLabel(text);
    setLabelVisible(false);
    // Flip to visible on the next tick so the "hidden" paint commits first -
    // otherwise React batches both writes into one frame and the browser
    // never actually sees an opacity change to transition.
    schedule(() => setLabelVisible(true), 20);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey(slug)) as Sentiment | null;
    setVoted(stored);
    // Restoring a prior vote on load is not a fresh interaction - show the
    // resting label immediately, no "arrival" fade for state that already
    // existed before this render.
    setDisplayedLabel(stored ? "Thanks!" : "Helpful?");
    setLabelVisible(true);
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
      showLabel("Thanks!");
      return;
    }

    const reviewPromptPending =
      typeof window !== "undefined" && !window.localStorage.getItem(REVIEW_PROMPTED_KEY);
    if (reviewPromptPending) {
      window.localStorage.setItem(REVIEW_PROMPTED_KEY, "1");
    }

    showLabel("Thanks!");

    if (!reviewPromptPending) return;

    if (prefersReducedMotion) {
      setShowReviewPrompt(true);
      setPillVisible(true);
      return;
    }

    // Hold on "Thanks!" long enough to read it, then hand off to the review
    // pill instead of leaving both static and visible at once.
    schedule(() => {
      setLabelVisible(false); // fade "Thanks!" out
      schedule(() => {
        setShowReviewPrompt(true);
        setPillVisible(false);
        schedule(() => setPillVisible(true), 20); // fade the pill in next tick
      }, FADE_MS);
    }, HOLD_MS);
  }

  function pickReason(reason: Reason) {
    if (reasonPicked) return;
    posthog.capture("icon_feedback_reason", { slug, reason, source: "detail_page" });
    gaFeedback(slug, "down", reason);
    setReasonPicked(reason);
    setPickingReason(false);
    window.open(withUtm(buildFeedbackIssueUrl(slug, title, reason), "icon_feedback"), "_blank", "noopener,noreferrer");
    showLabel("Thanks - opened an issue");
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
    clearScheduled();
    setVoted(null);
    setReasonPicked(null);
    setPickingReason(false);
    setDisplayedLabel("Helpful?");
    setLabelVisible(true);
    setPillVisible(false);
  }

  return (
    <div
      className={cn(
        "fixed right-4 z-40 flex flex-col items-end gap-2",
        "bottom-[max(76px,calc(var(--safe-bottom)+76px))] lg:bottom-6",
      )}
    >
      {pickingReason && (
        <div className="animate-fade-in-up surface-glass flex w-[min(200px,calc(100vw-2rem))] flex-col gap-1 rounded-2xl border border-border p-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] dark:border-white/[0.14]">
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
          className={cn(
            "surface-glass flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs text-foreground shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] transition-colors hover:bg-accent dark:border-white/[0.14]",
            "transition-opacity duration-200 ease-out motion-reduce:transition-none",
            pillVisible ? "opacity-100" : "opacity-0",
          )}
        >
          Glad it helped - leave a review?
          <ArrowUpRight className="h-3 w-3 opacity-60" />
        </a>
      )}

      <div className="surface-glass flex items-center gap-2 rounded-full border border-border px-3 py-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5),0_2px_8px_-2px_rgba(0,0,0,0.3)] dark:border-white/[0.14]">
        <span
          className={cn(
            "hidden text-xs text-muted-foreground transition-opacity duration-200 ease-out sm:inline",
            "motion-reduce:transition-none",
            labelVisible ? "opacity-100" : "opacity-0",
          )}
        >
          {displayedLabel}
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
