"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DOMAINS, GLYPHS } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { CategoryBanner } from "./category-banner";
import { THEMES, TONES, domainGlyphs } from "./category-theme";
import { Glyph } from "./glyph";
import { IconCard } from "./icon-card";
import { StyleBar } from "./lab";
import { useUi } from "./ui-state";

/** One category on its own page: its banner, the look bar, every icon, and a way to the other categories. */
export function CategoryPage({ domainId }: { domainId: string }) {
  const domain = DOMAINS.find((d) => d.id === domainId);
  const glyphs = useMemo(() => domainGlyphs(domainId), [domainId]);
  const others = useMemo(() => DOMAINS.filter((d) => d.id !== domainId && GLYPHS.some((g) => g.domain === d.id)), [domainId]);
  if (!domain) return null;
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/ui" className="transition-colors hover:text-foreground">UI icons</Link>
        <span aria-hidden>/</span>
        <Link href="/ui/categories" className="transition-colors hover:text-foreground">Categories</Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{domain.label}</span>
      </nav>
      <CategoryBanner category={domain.label} />
      <StyleBar />
      <h2 className="text-sm font-semibold">
        All {domain.label} icons <span className="ml-1 font-normal text-muted-foreground">{glyphs.length}</span>
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
        {glyphs.map((g) => (
          <IconCard key={g.slug} glyph={g} />
        ))}
      </div>
      <section aria-label="Other categories" className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">Other categories</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((d) => (
            <Link key={d.id} href={`/ui/category/${d.id}`} className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {d.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Every category as a card with a taste of its icons, for choosing where to look. */
export function CategoriesIndex() {
  const ui = useUi();
  const cards = useMemo(
    () => DOMAINS.map((d) => ({ domain: d, glyphs: domainGlyphs(d.id) })).filter((c) => c.glyphs.length > 0),
    [],
  );
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/ui" className="transition-colors hover:text-foreground">UI icons</Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">Categories</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Browse by category</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {GLYPHS.length} UI icons in {cards.length} categories. Each one is drawn on the same grid and comes in every look.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ domain, glyphs }) => {
          const theme = THEMES[domain.id];
          const tone = theme ? TONES[theme.tone] : TONES.sky;
          return (
            <Link
              key={domain.id}
              href={`/ui/category/${domain.id}`}
              className={cn("group flex flex-col gap-4 rounded-2xl border bg-gradient-to-br via-transparent to-transparent p-5 transition-colors hover:border-foreground/30", tone.glow)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{domain.label}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{theme?.tagline}</p>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium", tone.chip)}>{glyphs.length}</span>
              </div>
              <div className="flex gap-2">
                {glyphs.slice(0, 6).map((g) => (
                  <span key={g.slug} title={g.slug} className="grid size-11 place-items-center rounded-xl border bg-background/60">
                    <Glyph nodes={g.nodes} variant={ui.variant} size={22} accent={ui.accent} className={tone.ink} />
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
