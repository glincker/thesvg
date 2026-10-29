"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { IconEntry } from "@/lib/icons";
import { Search } from "@/components/own-icons";
import { IconCard } from "./icon-card";
import { IconDetail } from "./icon-detail";
import { cn } from "@/lib/utils";

type ViewMode = "compact" | "comfortable";

interface IconGridProps {
  icons: IconEntry[];
  view?: ViewMode;
}

/**
 * Column-count breakpoints, one list per view mode. These mirror the
 * `grid-cols-*` Tailwind classes below exactly - the virtualizer packs
 * `columns` icons into each virtual row, so the JS row-packing has to
 * match whatever CSS is actually going to render or rows will either
 * leave gaps or overflow into the next row.
 */
const COMPACT_BREAKPOINTS: { query: string; columns: number }[] = [
  { query: "(min-width: 1536px)", columns: 8 },
  { query: "(min-width: 1280px)", columns: 7 },
  { query: "(min-width: 1024px)", columns: 6 },
  { query: "(min-width: 768px)", columns: 5 },
  { query: "(min-width: 640px)", columns: 4 },
];
const COMFORTABLE_BREAKPOINTS: { query: string; columns: number }[] = [
  { query: "(min-width: 1280px)", columns: 6 },
  { query: "(min-width: 1024px)", columns: 5 },
  { query: "(min-width: 640px)", columns: 4 },
];

function resolveColumns(breakpoints: { query: string; columns: number }[]): number {
  if (typeof window === "undefined") return 3;
  for (const bp of breakpoints) {
    if (window.matchMedia(bp.query).matches) return bp.columns;
  }
  return 3;
}

/** Tracks the live column count for the active view mode via matchMedia,
 * so the virtualizer re-packs rows whenever the viewport crosses a
 * breakpoint (resize, orientation change, devtools responsive mode). */
function useColumnCount(view: ViewMode): number {
  const breakpoints = view === "compact" ? COMPACT_BREAKPOINTS : COMFORTABLE_BREAKPOINTS;
  return useSyncExternalStore(
    useCallback(
      (onChange) => {
        const mqls = breakpoints.map((bp) => window.matchMedia(bp.query));
        mqls.forEach((mql) => mql.addEventListener("change", onChange));
        return () => mqls.forEach((mql) => mql.removeEventListener("change", onChange));
      },
      // breakpoints is derived from `view`, which is the real dependency.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [view]
    ),
    () => resolveColumns(breakpoints),
    () => 3
  );
}

// Row height estimates in px, mirroring IconCard's own `containIntrinsicSize`
// layout-shift hints plus the grid row gap. The virtualizer self-corrects
// via ResizeObserver (see `measureElement` below) once rows actually mount,
// so this only needs to be a reasonable first guess.
const ROW_HEIGHT_ESTIMATE: Record<ViewMode, number> = {
  compact: 128,
  comfortable: 196,
};

export function IconGrid({ icons, view = "comfortable" }: IconGridProps) {
  const [selectedIcon, setSelectedIcon] = useState<IconEntry | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(view);
  const rowCount = Math.ceil(icons.length / columns);

  // The virtualizer needs to know how far the grid's top edge sits from the
  // top of the document (window scroll is relative to the document, not to
  // this container). Refs can't be read during render, so this is measured
  // in an effect and re-measured on resize / whenever the list above the
  // grid could have reflowed (icons or view mode changing).
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const node = parentRef.current;
    if (!node) return;
    const measure = () => setScrollMargin(node.offsetTop);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [icons, view]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_HEIGHT_ESTIMATE[view],
    overscan: 4,
    scrollMargin,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const gridColsClass =
    view === "compact"
      ? "grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
      : "grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6";

  const rows = useMemo(() => {
    return virtualRows.map((virtualRow) => ({
      virtualRow,
      rowIcons: icons.slice(
        virtualRow.index * columns,
        virtualRow.index * columns + columns
      ),
    }));
  }, [virtualRows, icons, columns]);

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
          <Search className="h-7 w-7 text-muted-foreground/50" />
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
      <div
        ref={parentRef}
        className="relative w-full"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rows.map(({ virtualRow, rowIcons }) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className={cn("absolute top-0 left-0 grid w-full", gridColsClass)}
            style={{
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
            }}
          >
            {rowIcons.map((icon, i) => (
              <IconCard
                key={icon.slug}
                icon={icon}
                onSelect={handleSelect}
                compact={view === "compact"}
                entranceDelay={i}
              />
            ))}
          </div>
        ))}
      </div>

      <IconDetail icon={selectedIcon} onClose={handleClose} />
    </>
  );
}
