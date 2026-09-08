"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkle, ArrowRight, X } from "@phosphor-icons/react/dist/ssr";

// Bump this when there's a new batch of improvements worth announcing again -
// changing the value makes the toast reappear even for users who dismissed
// a previous version, since it's a different key in localStorage.
const IMPROVEMENTS_VERSION = "2026-09-ui-polish-1";
const STORAGE_KEY = `thesvg-seen-improvements-${IMPROVEMENTS_VERSION}`;
const POST_SLUG = "icon-page-redesign-brand-color-completeness";
const SHOW_DELAY_MS = 2500;
const AUTO_DISMISS_MS = 12000;

export function ImprovementsToast() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // storage blocked
    }
  }

  if (!visible || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed right-6 bottom-6 z-50 w-full max-w-[300px] overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-500 dark:border-white/[0.08] dark:bg-black/85"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-orange-500/[0.06] px-4 py-2.5 dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Sparkle weight="fill" className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-[11px] font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
            What&apos;s new
          </span>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold text-foreground">
          Icon pages just got a redesign
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Brand-color previews, a plain-language completeness checklist, and smoother motion throughout.
        </p>
        <Link
          href={`/blog/${POST_SLUG}`}
          onClick={dismiss}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-500 transition-opacity hover:opacity-70"
        >
          Read the details
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
