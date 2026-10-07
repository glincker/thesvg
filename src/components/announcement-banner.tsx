"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { ArrowRight, Star, X } from "lucide-react";
import { withUtm } from "@/lib/external-link";

const STORAGE_KEY = "thesvg-banner-theauth-2026-10";
const REPO_URL = "https://github.com/glincker/theauth";
const POST_PATH = "/blog/theauth-joins-glinr-studios";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage can be blocked (private mode); keep the banner visible.
    return false;
  }
}

/**
 * Site-wide announcement strip rendered above the desktop header, styled to
 * match theauth.dev: near-black floor, a fine dot texture, a lime accent and a
 * soft teal and lime glow in the corners.
 * Sticky at the top of the viewport and publishes its rendered height as
 * `--banner-h` (0px when hidden, dismissed or unmounted) so the sticky header
 * and fixed sidebars offset below it.
 * Shown from `md` up only: below `md` the MobileShell floats its own fixed
 * top bar, which would cover a banner at the top of the page.
 * Dismissal is remembered per browser; storage failures just show the banner.
 */
export function AnnouncementBanner() {
  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissedBefore = useSyncExternalStore(subscribe, readDismissed, () => false);
  const hidden = dismissedNow || dismissedBefore;
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const node = bannerRef.current;
    if (hidden || !node) {
      root.style.setProperty("--banner-h", "0px");
      return;
    }
    // offsetHeight is 0 below md where the banner is display: none, and it
    // changes if the text wraps, so keep the variable in sync.
    const sync = () => root.style.setProperty("--banner-h", `${node.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.setProperty("--banner-h", "0px");
    };
  }, [hidden]);

  if (hidden) {
    return null;
  }

  const dismiss = () => {
    setDismissedNow(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore storage failures.
    }
    posthog.capture("announcement_banner_dismissed", { campaign: "theauth_2026_10" });
  };

  return (
    <div
      ref={bannerRef}
      role="region"
      aria-label="Announcement"
      className="sticky top-0 z-[60] hidden w-full items-center justify-center gap-3 overflow-hidden bg-[#050506] bg-[radial-gradient(circle,rgba(255,255,255,0.11)_0.7px,transparent_1.2px)] bg-[length:6px_6px] px-4 py-2 text-xs text-white md:flex"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_160%_at_0%_0%,rgba(0,203,170,0.22),transparent),radial-gradient(40%_160%_at_100%_0%,rgba(238,243,95,0.2),transparent)]"
      />
      <p className="relative truncate">
        <span className="font-semibold">theAuth joins GLINR Studios.</span>{" "}
        <span className="text-white/70">Open-source auth for AI agents, in TypeScript and Go.</span>
      </p>
      <a
        href={withUtm(REPO_URL, "announcement_banner")}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => posthog.capture("announcement_banner_clicked", { target: "github_star" })}
        className="relative inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#eef35f] px-2.5 py-1 font-medium text-black transition-opacity hover:opacity-90"
      >
        <Star className="h-3 w-3" aria-hidden="true" />
        Star on GitHub
      </a>
      <Link
        href={POST_PATH}
        onClick={() => posthog.capture("announcement_banner_clicked", { target: "blog_post" })}
        className="relative inline-flex shrink-0 items-center gap-1 font-medium text-[#eef35f] underline underline-offset-2 hover:opacity-80"
      >
        Read the story
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="relative ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
