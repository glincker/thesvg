"use client";

import { useCallback, useMemo, useState } from "react";
import type { IconEntry } from "@/lib/icons";
import { IconCard } from "./icon-card";
import { IconDetail } from "./icon-detail";
import { cn } from "@/lib/utils";

type ViewMode = "compact" | "comfortable";

interface IconGridProps {
  icons: IconEntry[];
  view?: ViewMode;
}

const INITIAL_COUNT = 120;
const LOAD_MORE_COUNT = 120;

export function IconGrid({ icons, view = "comfortable" }: IconGridProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [selectedIcon, setSelectedIcon] = useState<IconEntry | null>(null);

  const visibleIcons = useMemo(
    () => icons.slice(0, visibleCount),
    [icons, visibleCount]
  );

  const hasMore = visibleCount < icons.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, icons.length));
  }, [icons.length]);

  const handleSelect = useCallback((icon: IconEntry) => {
    setSelectedIcon(icon);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIcon(null);
  }, []);

  if (icons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">No icons found</p>
        <p className="text-sm">Try a different search term or category</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "grid",
        view === "compact"
          ? "grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
          : "grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      )}>
        {visibleIcons.map((icon, i) => (
          <div
            key={icon.slug}
            className="min-w-0 animate-fade-in-up"
            style={{ animationDelay: `${Math.min(i * 20, 600)}ms` }}
          >
            <IconCard icon={icon} onSelect={handleSelect} compact={view === "compact"} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Load more ({icons.length - visibleCount} remaining)
          </button>
        </div>
      )}

      <IconDetail icon={selectedIcon} onClose={handleClose} />
    </>
  );
}
