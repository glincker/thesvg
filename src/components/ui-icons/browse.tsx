"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GLYPHS } from "@/lib/ui-icons/glyphs";
import { POPULAR } from "@/lib/ui-icons/popular";
import { cn } from "@/lib/ui-icons/utils";
import { Hero } from "./hero";
import { IconCard } from "./icon-card";
import { StyleBar } from "./lab";
import { useUi } from "./ui-state";

const PAGE = 48;
const POPULAR_SHOWN = 14;

export function Browse() {
  const ui = useUi();
  const [shown, setShown] = useState(PAGE);
  // Category counts follow the selected set, so the pills never promise more than the grid shows.
  const categories = useMemo(() => {
    const pool = GLYPHS.filter(
      (g) =>
        ui.set === "all" ||
        g.setId === ui.set ||
        (ui.set === "drops" && g.setId.startsWith("drop-")),
    );
    const counts = new Map<string, number>();
    for (const g of pool)
      counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
    // ⚡ Bolt: Replace [...map.entries()].map() with Array.from(map, ...) to avoid tuple allocations
    return {
      total: pool.length,
      rows: Array.from(counts, ([name, count]) => ({ name, count })).sort(
        (a, b) => b.count - a.count,
      ),
    };
  }, [ui.set]);
  const list = useMemo(() => {
    const q = ui.query.trim().toLowerCase();
    return GLYPHS.filter(
      (g) =>
        (ui.set === "all" ||
          g.setId === ui.set ||
          (ui.set === "drops" && g.setId.startsWith("drop-"))) &&
        (ui.category === "All" || g.category === ui.category) &&
        (!ui.onlyFavorites || ui.favorites.includes(g.slug)) &&
        (!q ||
          g.slug.includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))),
    );
  }, [ui.query, ui.category, ui.onlyFavorites, ui.favorites, ui.set]);

  // With no filter on, lead with the glyphs people reach for most and list the rest alphabetically below them.
  const unfiltered =
    ui.category === "All" &&
    ui.set === "all" &&
    !ui.query.trim() &&
    !ui.onlyFavorites;
  const popular = useMemo(
    () => (unfiltered ? POPULAR.slice(0, POPULAR_SHOWN) : []),
    [unfiltered],
  );
  const rest = useMemo(() => {
    if (!unfiltered) return list;
    // ⚡ Bolt: Use a single-pass loop instead of `new Set(array.map(...))`
    const top = new Set<string>();
    for (let i = 0; i < popular.length; i++) top.add(popular[i].slug);
    return list
      .filter((g) => !top.has(g.slug))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }, [list, popular, unfiltered]);

  // Infinite scroll: a sentinel below the grid asks for the next batch when it comes into view.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShown((n) => n + PAGE);
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rest.length, shown]);
  useEffect(() => {
    setShown(PAGE);
  }, [ui.query, ui.category, ui.set, ui.onlyFavorites]);

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-4">
      <Hero />
      <StyleBar />
      <div
        id="browse"
        className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {[{ name: "All", count: categories.total }, ...categories.rows].map(
          (c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                ui.setCategory(c.name);
                setShown(PAGE);
              }}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                ui.category === c.name &&
                  "bg-foreground text-background hover:text-background",
              )}
            >
              {c.name}
              {c.name === "All" && (
                <span
                  className={cn(
                    "rounded-full bg-foreground/10 px-1.5 text-[0.75rem]",
                    ui.category === c.name && "bg-background/20",
                  )}
                >
                  {c.count}
                </span>
              )}
            </button>
          ),
        )}
      </div>
      {popular.length > 0 && (
        <section aria-label="Popular">
          <div className="mb-2 flex items-baseline gap-2">
            <h2 className="text-sm font-semibold">Popular</h2>
            <span className="text-xs text-muted-foreground">
              The ones you will reach for first
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
            {popular.map((g) => (
              <IconCard key={g.slug} glyph={g} />
            ))}
          </div>
        </section>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          {ui.onlyFavorites
            ? "Favorites"
            : ui.category === "All"
              ? "All UI icons"
              : ui.category}
          <span className="ml-2 font-normal text-muted-foreground">
            {list.length}
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
        {rest.slice(0, shown).map((g) => (
          <IconCard key={g.slug} glyph={g} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No icons match. Try another word or clear the filter.
        </p>
      )}
      {rest.length > shown ? (
        <div
          ref={sentinel}
          className="py-6 text-center text-xs text-muted-foreground"
        >
          Loading more icons
        </div>
      ) : (
        rest.length > PAGE && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            That is all {list.length}
          </p>
        )
      )}
    </div>
  );
}
