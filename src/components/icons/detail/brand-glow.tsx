"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { brandGlowColor } from "@/lib/brand-glow-color";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "thesvg-brand-glow-enabled";
const HINT_SEEN_KEY = "thesvg-brand-glow-hint-seen";
// Fully faded out by this much scroll - the glow reads as a "top of page"
// accent, not a backdrop that stays glued to the viewport forever.
const FADE_DISTANCE_PX = 480;
// Drifts upward slower than the page scrolls, for a subtle parallax depth
// cue rather than scrolling 1:1 with content.
const PARALLAX_FACTOR = 0.25;

export function BrandGlow({ hex }: { hex?: string }) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const scrollLayerRef = useRef<HTMLDivElement>(null);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_SEEN_KEY, "1");
    } catch {
      // storage blocked
    }
  }, []);

  useEffect(() => {
    setReady(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Absent = new user, default on. Only an explicit "0" turns it off.
      setEnabled(stored !== "0");

      if (!localStorage.getItem(HINT_SEEN_KEY)) {
        const timer = setTimeout(() => setShowHint(true), 1800);
        return () => clearTimeout(timer);
      }
    } catch {
      // storage blocked
    }
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(dismissHint, 6000);
    return () => clearTimeout(timer);
  }, [showHint, dismissHint]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let ticking = false;
    const applyScrollEffect = () => {
      ticking = false;
      const el = scrollLayerRef.current;
      if (!el) return;
      const y = window.scrollY;
      const fade = Math.max(0, 1 - y / FADE_DISTANCE_PX);
      el.style.opacity = String(fade);
      el.style.transform = `translateY(${-y * PARALLAX_FACTOR}px)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(applyScrollEffect);
    };

    applyScrollEffect();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggle() {
    dismissHint();
    const next = !enabled;
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // storage blocked
    }
    setEnabled(next);
  }

  // Falls back to theSVG's own brand orange for the many icons whose hex is
  // missing or too greyscale to glow with directly. Dimmed further than a
  // real brand color so it reads as "no specific color available" rather
  // than implying orange is somehow this brand's color.
  const realColor = brandGlowColor(hex);
  const glowColor = realColor ?? "#F97316";
  const glowOpacityClass = realColor ? "opacity-[0.14] dark:opacity-[0.4]" : "opacity-[0.08] dark:opacity-[0.22]";

  return (
    <>
      {ready && (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 top-0 -z-10 h-[560px] transition-[opacity,transform] duration-500 ease-out",
            enabled ? "scale-100 opacity-100" : "scale-90 opacity-0"
          )}
          aria-hidden="true"
        >
          <div ref={scrollLayerRef} className="h-full w-full" style={{ willChange: "opacity, transform" }}>
            <div
              className={cn("animate-glow-drift h-full w-full will-change-transform", glowOpacityClass)}
              style={{
                background: `radial-gradient(ellipse 65% 100% at 50% 0%, ${glowColor}, transparent 72%)`,
                filter: "blur(40px)",
              }}
            />
          </div>
        </div>
      )}
      {ready && (
        <div className="fixed top-20 right-3 z-40 sm:right-5">
          {showHint && (
            <div
              role="status"
              className="animate-in slide-in-from-right-2 fade-in absolute top-1/2 right-full mr-2.5 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border/60 bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-lg duration-300"
            >
              Toggle the background glow
              <span className="absolute top-1/2 left-full -translate-y-1/2 border-4 border-transparent border-l-foreground" />
            </div>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={enabled ? "Turn off background glow" : "Turn on background glow"}
            aria-pressed={enabled}
            title={enabled ? "Turn off background glow" : "Turn on background glow"}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <Sparkle
              weight={enabled ? "fill" : "regular"}
              className="h-3.5 w-3.5"
              style={enabled ? { color: glowColor } : undefined}
            />
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-card transition-colors",
                enabled ? "bg-green-500" : "bg-muted-foreground/40"
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </>
  );
}
