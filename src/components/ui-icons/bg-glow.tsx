"use client";

import { UiGlyph } from "@/components/ui-glyph";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/ui-icons/utils";
import { useUi } from "./ui-state";

const STORAGE_KEY = "svg-icons-glow";
// Fully faded by this much scroll, so it reads as a top-of-page atmosphere and not a permanent backdrop.
const FADE_DISTANCE_PX = 520;
// Drifts up slower than the content scrolls, a small depth cue.
const PARALLAX = 0.25;
const DEFAULT_GLOW = "#f97316";
/**
 * Page atmosphere: soft colored blobs, grain-dissolved glow and film grain, all faded out on every side so nothing is cropped,
 * plus a spotlight that follows the pointer. The blobs take the accent color you pick, orange otherwise.
 */
export function BgGlow() {
  const ui = useUi();
  const [ready, setReady] = useState(false);
  const [on, setOn] = useState(true);
  const layer = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReady(true);
    try {
      setOn(window.localStorage.getItem(STORAGE_KEY) !== "0");
    } catch {
      setOn(true);
    }
  }, []);

  useEffect(() => {
    root.current?.style.setProperty("--glow", ui.accent || DEFAULT_GLOW);
    document.documentElement.style.setProperty("--glow", ui.accent || DEFAULT_GLOW);
  }, [ui.accent, ready]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    const apply = () => {
      ticking = false;
      const el = layer.current;
      if (!el) return;
      const y = window.scrollY;
      el.style.opacity = String(Math.max(0, 1 - y / FADE_DISTANCE_PX));
      el.style.transform = `translateY(${-y * PARALLAX}px)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    };
    // The spotlight follows the pointer on devices that have one.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      root.current?.style.setProperty("--mx", `${e.clientX}px`);
      root.current?.style.setProperty("--my", `${e.clientY}px`);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, [ready]);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* storage can be blocked, the choice then lasts for this visit */
    }
  };

  if (!ready) return null;
  return (
    <>
      <div ref={root} aria-hidden="true" className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-opacity duration-500", on ? "opacity-100" : "opacity-0")}>
        {/* The whole stack fades to nothing on every side, so there is no edge to crop. */}
        <div ref={layer} className="absolute inset-x-0 top-0 h-[720px] will-change-[opacity,transform] [mask-image:radial-gradient(ellipse_75%_90%_at_50%_0%,#000_25%,transparent_72%)]">
          <div className="absolute -left-[8%] top-[-12%] size-[560px] rounded-full opacity-[0.3] blur-[90px] [background:radial-gradient(circle,var(--glow,#f97316),transparent_68%)] dark:opacity-[0.3]" />
          <div className="absolute left-[34%] top-[-18%] size-[620px] rounded-full opacity-[0.24] blur-[100px] [background:radial-gradient(circle,color-mix(in_oklab,var(--glow,#f97316)_55%,#fbbf24),transparent_68%)] dark:opacity-[0.22]" />
          <div className="absolute -right-[6%] top-[-10%] size-[520px] rounded-full opacity-[0.18] blur-[90px] [background:radial-gradient(circle,color-mix(in_oklab,var(--glow,#f97316)_30%,#38bdf8),transparent_68%)] dark:opacity-[0.2]" />
          <div className="grain-glow absolute inset-0">
            <div className="absolute -left-[8%] top-[-12%] size-[560px] rounded-full opacity-[0.3] blur-[90px] [background:radial-gradient(circle,var(--glow,#f97316),transparent_68%)] dark:opacity-[0.3]" />
            <div className="absolute left-[34%] top-[-18%] size-[620px] rounded-full opacity-[0.24] blur-[100px] [background:radial-gradient(circle,color-mix(in_oklab,var(--glow,#f97316)_55%,#fbbf24),transparent_68%)] dark:opacity-[0.22]" />
            <div className="absolute -right-[6%] top-[-10%] size-[520px] rounded-full opacity-[0.18] blur-[90px] [background:radial-gradient(circle,color-mix(in_oklab,var(--glow,#f97316)_30%,#38bdf8),transparent_68%)] dark:opacity-[0.2]" />
          </div>
        </div>
        <div className="grain absolute inset-0 opacity-[0.05] mix-blend-overlay dark:opacity-[0.07]" />
        <div className="absolute inset-0 [background:radial-gradient(460px_circle_at_var(--mx,50%)_var(--my,-30%),rgba(255,255,255,0.055),transparent_62%)]" />
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Turn off background effects" : "Turn on background effects"}
        title={on ? "Turn off background effects" : "Turn on background effects"}
        className="fixed right-4 top-20 z-40 grid size-8 place-items-center rounded-full border bg-card/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
      >
        <UiGlyph name="sparkles" className={cn("size-3.5", on && "fill-orange-500 text-orange-500")} />
        <span className={cn("absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-card", on ? "bg-green-500" : "bg-muted-foreground/40")} />
      </button>
    </>
  );
}

