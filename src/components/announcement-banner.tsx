"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "thesvg-announcement-glinr-studios-dismissed";

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // storage blocked
    }
  }, []);

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
    <div className="relative z-50 flex items-center justify-center gap-2 bg-foreground/[0.04] px-4 py-1.5 text-center text-xs text-muted-foreground backdrop-blur-sm dark:bg-white/[0.04]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />
      <span>
        thesvg is joining{" "}
        <span className="font-semibold text-foreground">GLINR Studios</span>
        {" "}in Q3 2026. The platform stays fully open source.
      </span>
      <Link
        href="/blog/thesvg-joining-glinr-studios"
        className="ml-1 shrink-0 font-medium text-orange-500 underline underline-offset-2 hover:text-orange-400"
      >
        Read more
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="ml-2 shrink-0 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
