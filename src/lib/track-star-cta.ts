"use client";

import posthog from "posthog-js";

export type StarCtaSource = "header" | "star_prompt" | "footer" | "blog_page";
export type StarCtaAction = "viewed" | "clicked";

const VIEWED_PREFIX = "thesvg-star-cta-viewed-";

/**
 * One analytics event for every GitHub star call to action, so the funnel
 * (viewed, then clicked) can be compared across placements. `viewed` fires at
 * most once per tab session per placement. The matching outbound link already
 * carries utm_campaign=<source> via withUtm.
 */
export function trackStarCta(
  source: StarCtaSource,
  action: StarCtaAction,
  stars: number | null = null
): void {
  if (action === "viewed") {
    try {
      const key = VIEWED_PREFIX + source;
      if (window.sessionStorage.getItem(key) === "1") return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: fall through and count the view.
    }
  }
  posthog.capture("github_star_cta", { source, action, stars });
}
