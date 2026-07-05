"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "thesvg-announcement-glinr-studios-dismissed";

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // storage blocked
    }
  }, []);

  // Publish the banner's height as a CSS variable so the sticky header and the
  // fixed sidebar can offset themselves and never overlap the bar. Resets to 0
  // when the bar is hidden/dismissed.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.setProperty("--banner-h", "0px");
      return;
    }
    const el = ref.current;
    if (!el) return;
    const apply = () => root.style.setProperty("--banner-h", `${el.offsetHeight}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.setProperty("--banner-h", "0px");
    };
  }, [visible]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // storage blocked
    }
  }

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="sticky top-0 z-[60] flex items-center justify-center gap-x-2 gap-y-1 border-b border-orange-500/15 bg-gradient-to-r from-orange-500/[0.06] via-background/70 to-orange-500/[0.06] px-10 py-2 text-center text-xs text-muted-foreground backdrop-blur-md dark:border-orange-500/20 dark:bg-black/50"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500/60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
      </span>
      <span className="leading-snug">
        thesvg is joining{" "}
        <span className="font-semibold text-foreground">GLINR Studios</span>
        {" "}in Q3 2026, staying fully open source.
      </span>
      <Link
        href="/blog/thesvg-joining-glinr-studios"
        className="group inline-flex shrink-0 items-center gap-0.5 font-medium text-orange-500 transition-colors hover:text-orange-400"
      >
        Read more
        <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2.5 rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-foreground dark:hover:bg-white/[0.06]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
