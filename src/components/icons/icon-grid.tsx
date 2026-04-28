"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IconEntry } from "@/lib/icons";
import { IconCard } from "./icon-card";
import { IconDetail } from "./icon-detail";
import { cn } from "@/lib/utils";

type ViewMode = "compact" | "comfortable";

interface IconGridProps {
  icons: IconEntry[];
  view?: ViewMode;
}

const INITIAL_COUNT = 60;
const LOAD_MORE_COUNT = 60;

export function IconGrid({ icons, view = "comfortable" }: IconGridProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [selectedIcon, setSelectedIcon] = useState<IconEntry | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const visibleIcons = useMemo(
    () => icons.slice(0, visibleCount),
    [icons, visibleCount]
  );

  const hasMore = visibleCount < icons.length;

  // Intersection observer for infinite scroll.
  // The parent passes a stable `key` derived from the active query+category so
  // React remounts this component with fresh state when filters change — no
  // secondary setState loop is needed to reset visibleCount.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const total = icons.length;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          setVisibleCount((prev) => {
            const next = Math.min(prev + LOAD_MORE_COUNT, total);
            setTimeout(() => { loadingRef.current = false; }, 200);
            return next;
          });
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // icons.length is the only sentinel-rebuild trigger; visibleCount changes
    // are handled inside the callback via closure over `total`.
  }, [icons.length]);

  const handleSelect = useCallback((icon: IconEntry) => {
    setSelectedIcon(icon);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIcon(null);
  }, []);

  if (icons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 dark:bg-white/[0.04]">
          <svg className="h-7 w-7 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-base font-medium text-foreground">No icons found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try a different search term or category</p>
        <a
          href="/submit"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-400"
        >
          Submit this icon
        </a>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "grid",
        view === "compact"
          ? "grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
          : "grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6"
      )}>
        {visibleIcons.map((icon) => (
          <IconCard key={icon.slug} icon={icon} onSelect={handleSelect} compact={view === "compact"} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
        </div>
      )}

      <IconDetail icon={selectedIcon} onClose={handleClose} />
    </>
  );
}
