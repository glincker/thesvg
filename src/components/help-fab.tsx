"use client";

import { useState, useEffect, useRef } from "react";
import { X, MousePointerClick, Copy, Download, Search, Heart, Keyboard, Sparkles } from "lucide-react";

const TIPS = [
  {
    icon: MousePointerClick,
    title: "Click any icon",
    description: "Open the detail page with code snippets, variants, and export options",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/25",
  },
  {
    icon: Copy,
    title: "Quick copy",
    description: "Hit the copy button on any card to grab the SVG instantly",
    gradient: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/25",
  },
  {
    icon: Download,
    title: "Download & export",
    description: "Download SVG or export as PNG at 32-512px from the detail page",
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/25",
  },
  {
    icon: Search,
    title: "Search everything",
    description: "Press Cmd+K to search across 5,600+ icons",
    gradient: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/25",
  },
  {
    icon: Heart,
    title: "Save favorites",
    description: "Heart icons to save them. Access from the sidebar anytime",
    gradient: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/25",
  },
  {
    icon: Keyboard,
    title: "Use anywhere",
    description: "npm, React, Vue, CLI, CDN, or MCP server for AI assistants",
    gradient: "from-indigo-500 to-blue-600",
    glow: "shadow-indigo-500/25",
  },
];

export function HelpFab() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [visibleTips, setVisibleTips] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setClosing(false);
    requestAnimationFrame(() => setMounted(true));
  };

  const handleClose = () => {
    setClosing(true);
    setMounted(false);
    setVisibleTips([]);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 250);
  };

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  // Stagger tip animations on open
  useEffect(() => {
    if (!mounted) return;
    const timers = [
      setTimeout(() => setVisibleTips([]), 0),
      ...TIPS.map((_, i) =>
        setTimeout(() => setVisibleTips((prev) => [...prev, i]), 80 + i * 60)
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [mounted]);

  return (
    <>
      {/* FAB button with pulse ring */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={handleOpen}
          className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/90 text-muted-foreground shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-orange-500/40 hover:text-orange-500 hover:shadow-xl hover:shadow-orange-500/10 active:scale-95 dark:border-white/10 dark:bg-white/5"
          aria-label="Help and tips"
        >
          <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
        </button>
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/70 backdrop-blur-lg transition-opacity duration-300 ${
              mounted && !closing ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Modal */}
          <div
            className={`relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] transition-all duration-300 ease-out ${
              mounted && !closing
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-8 scale-95 opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glassmorphic background layers */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/97 via-zinc-900/95 to-zinc-950/98 backdrop-blur-2xl" />

            {/* Animated gradient border top */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

            {/* Subtle inner glow */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.05]" />

            {/* Background decorative blobs - animated */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 animate-pulse rounded-full bg-orange-500/8 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 animate-pulse rounded-full bg-violet-500/8 blur-3xl" style={{ animationDelay: "1s" }} />
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

            {/* Content */}
            <div className="relative p-6 sm:p-7">
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 rounded-xl p-2 text-zinc-500 transition-all duration-200 hover:bg-white/10 hover:text-zinc-300 hover:rotate-90"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400 shadow-lg shadow-orange-500/5">
                  <Sparkles className="h-3 w-3" />
                  Getting Started
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">Quick Tips</h2>
                <p className="mt-1 text-sm text-zinc-400">Everything you can do with theSVG</p>
              </div>

              {/* Tips - scrollable on mobile */}
              <div ref={scrollRef} className="grid max-h-[50vh] gap-2 overflow-y-auto pr-1 sm:max-h-none sm:gap-2.5">
                {TIPS.map((tip, index) => (
                  <div
                    key={tip.title}
                    className={`group flex items-start gap-3.5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3.5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20 ${
                      visibleTips.includes(index)
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0"
                    }`}
                  >
                    {/* Gradient icon with hover lift */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tip.gradient} shadow-lg ${tip.glow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <tip.icon className="h-4.5 w-4.5 text-white drop-shadow-sm" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[13px] font-semibold text-zinc-100 transition-colors group-hover:text-white">{tip.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-400">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-zinc-600">
                  Press <kbd className="rounded-md border border-zinc-700/80 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 shadow-sm">Esc</kbd> to close
                </p>
                <button
                  onClick={handleClose}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">Got it</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
