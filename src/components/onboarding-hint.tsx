"use client";

import { useState, useEffect } from "react";
import { X, MousePointerClick } from "lucide-react";

const STORAGE_KEY = "thesvg-hint-dismissed";

export function OnboardingHint() {
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);

  const dismiss = () => {
    setEntering(false);
    setTimeout(() => setVisible(false), 300);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setEntering(true));
    }, 2500);

    const autoHide = setTimeout(() => {
      dismiss();
    }, 12500);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ease-out ${
        entering
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0"
      }`}
    >
      {/* Glow backdrop */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-500/30 opacity-75 blur-lg" />

      {/* Main pill */}
      <div className="relative flex items-center gap-3 rounded-xl border border-orange-400/50 bg-gradient-to-r from-orange-950 to-amber-950 px-5 py-3 shadow-2xl shadow-orange-500/20 ring-1 ring-orange-500/20 dark:from-orange-950 dark:to-amber-950">
        {/* Animated icon */}
        <div className="flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
          <MousePointerClick className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-orange-50">Click any icon for details</p>
          <p className="text-xs text-orange-200/70">Copy code, download, export PNG, and more</p>
        </div>

        <button
          onClick={dismiss}
          className="ml-2 shrink-0 rounded-md p-1.5 text-orange-300/60 transition-colors hover:bg-orange-500/20 hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
