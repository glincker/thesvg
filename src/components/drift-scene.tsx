"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Wrapper for the drifting hero rows: pauses the animation when the banner is off screen or the tab is hidden. */
export function DriftScene({ className, children }: Readonly<{ className?: string; children: React.ReactNode }>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = true;
    const apply = (): void => {
      el.dataset.paused = inView && !document.hidden ? "false" : "true";
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      apply();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", apply);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);
  return (
    <div ref={ref} className={cn("flags-scene", className)}>
      {children}
    </div>
  );
}
