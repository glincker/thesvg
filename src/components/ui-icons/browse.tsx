"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GLYPHS } from "@/lib/ui-icons/glyphs";
import { closest, rankTiered } from "@/lib/ui-icons/search";
import { searchableOf } from "@/lib/ui-icons/searchable";
import { POPULAR } from "@/lib/ui-icons/popular";
import { cn } from "@/lib/ui-icons/utils";
import { CategoryBanner } from "./category-banner";
import { Hero } from "./hero";
import { IconCard } from "./icon-card";
import { StyleBar } from "./lab";
import { useUi } from "./ui-state";

/** "new" is every glyph of the newest drop, whichever set file it lives in. */
const inSet = (g: (typeof GLYPHS)[number], set: string): boolean => set === "all" || g.setId === set || (set === "drops" && g.setId.startsWith("drop-")) || (set === "new" && g.isNew);

const PAGE = 48;

/** One row of card placeholders under the grid while the next batch is on its way. */
function Skeletons() {
  return (
    <div aria-hidden className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[176px] animate-pulse rounded-2xl border border-border/40 bg-muted-foreground/[0.06]" />
      ))}
    </div>
  );
}
const POPULAR_SHOWN = 14;

export function Browse() {
  const ui = useUi();
  const [shown, setShown] = useState(PAGE);
  // Category counts follow the selected set, so the pills never promise more than the grid shows.
  const categories = useMemo(() => {
    const pool = GLYPHS.filter((g) => inSet(g, ui.set));
    const counts = new Map<string, number>();
    for (const g of pool) counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
    // ⚡ Bolt: Use Array.from instead of [...counts.entries()].map(...) to prevent intermediate array allocations
    return { total: pool.length, rows: Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count) };
  }, [ui.set]);
  // A query ranks by how well each icon matches and splits into the strong matches and the related ones. With none, the grid keeps its own order.
  const tiers = useMemo(() => {
    const q = ui.query.trim();
    const scoped = GLYPHS.filter((g) => inSet(g, ui.set) && (ui.category === "All" || g.category === ui.category) && (!ui.onlyFavorites || ui.favorites.includes(g.slug)));
    return { scoped, ranked: q ? rankTiered(q, scoped, searchableOf) : null };
  }, [ui.query, ui.category, ui.onlyFavorites, ui.favorites, ui.set]);
  const list = useMemo(() => (tiers.ranked ? [...tiers.ranked.best, ...tiers.ranked.related] : tiers.scoped), [tiers]);
  const bestCount = tiers.ranked?.best.length ?? 0;
  const suggestion = useMemo(() => (list.length === 0 && ui.query.trim() ? closest(ui.query, GLYPHS.flatMap((g) => [g.slug, ...g.tags])) : null), [list.length, ui.query]);

  // With no filter on, lead with the glyphs people reach for most and list the rest alphabetically below them.
  const unfiltered = ui.category === "All" && ui.set === "all" && !ui.query.trim() && !ui.onlyFavorites;
  const popular = useMemo(() => (unfiltered ? POPULAR.slice(0, POPULAR_SHOWN) : []), [unfiltered]);
  const rest = useMemo(() => {
    if (!unfiltered) return list;
    // ⚡ Bolt: Use a single-pass loop instead of `new Set(array.map(...))` to
    // avoid allocating intermediate arrays and reduce garbage collection pressure.
    const top = new Set<string>();
    for (let i = 0; i < popular.length; i++) top.add(popular[i].slug);
    return list.filter((g) => !top.has(g.slug)).sort((a, b) => a.slug.localeCompare(b.slug));
  }, [list, popular, unfiltered]);

  // Infinite scroll: a sentinel below the grid asks for the next batch when it comes into view.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [rest.length, shown]);
  useEffect(() => { setShown(PAGE); }, [ui.query, ui.category, ui.set, ui.onlyFavorites]);

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-4">
      {ui.query.trim() ? null : ui.category !== "All" && ui.set === "all" && !ui.onlyFavorites ? <CategoryBanner category={ui.category} /> : <Hero />}
      <div className="flex items-center gap-3">
      <div id="browse" className="-mx-1 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 pb-1">
        {[{ name: "All", count: categories.total }, ...categories.rows].map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => { ui.setCategory(c.name); setShown(PAGE); }}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              ui.category === c.name && "bg-foreground text-background hover:text-background",
            )}
          >
            {c.name}
            {c.name === "All" && <span className={cn("rounded-full bg-foreground/10 px-1.5 text-[0.75rem]", ui.category === c.name && "bg-background/20")}>{c.count}</span>}
          </button>
        ))}
      </div>
      <StyleBar />
      </div>
      {popular.length > 0 && (
        <section aria-label="Popular">
          <div className="mb-2 flex items-baseline gap-2">
            <h2 className="text-sm font-semibold">Popular</h2>
            <span className="text-xs text-muted-foreground">The ones you will reach for first</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
            {popular.map((g) => (
              <IconCard key={g.slug} glyph={g} />
            ))}
          </div>
        </section>
      )}
      {tiers.ranked ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">
              Best matches<span className="ml-2 font-normal text-muted-foreground">{bestCount}</span>
            </h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
            {rest.slice(0, Math.min(shown, bestCount)).map((g) => (
              <IconCard key={g.slug} glyph={g} />
            ))}
          </div>
          {list.length > bestCount && shown > bestCount && (
            <>
              <h2 className="mt-2 text-sm font-semibold">
                Related<span className="ml-2 font-normal text-muted-foreground">{list.length - bestCount}</span>
                <span className="ml-2 text-xs font-normal text-muted-foreground">same family, synonyms and close spellings</span>
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
                {rest.slice(bestCount, shown).map((g) => (
                  <IconCard key={g.slug} glyph={g} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">
              {ui.onlyFavorites ? "Favorites" : ui.category === "All" ? "All UI icons" : ui.category}
              <span className="ml-2 font-normal text-muted-foreground">{list.length}</span>
            </h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
            {rest.slice(0, shown).map((g) => (
              <IconCard key={g.slug} glyph={g} />
            ))}
          </div>
        </>
      )}
      {list.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No icons match.{" "}
          {suggestion ? (
            <>
              Did you mean{" "}
              <button type="button" onClick={() => ui.setQuery(suggestion)} className="font-medium text-foreground underline underline-offset-2">
                {suggestion}
              </button>
              ?
            </>
          ) : (
            "Try another word or clear the filter."
          )}
        </p>
      )}
      {rest.length > shown ? (
        <div ref={sentinel} role="status" aria-label="Loading more icons"><Skeletons /></div>
      ) : (
        rest.length > PAGE && <p className="py-6 text-center text-xs text-muted-foreground">That is all {list.length}</p>
      )}
    </div>
  );
}
