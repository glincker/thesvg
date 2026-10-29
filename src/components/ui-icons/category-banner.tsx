"use client";

import { useMemo } from "react";
import { UiGlyph } from "@/components/ui-glyph";
import { DOMAINS, type Glyph as GlyphData } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { SCATTER_OFFSET, THEMES, TONES, domainGlyphs } from "./category-theme";
import { Glyph } from "./glyph";
import { useUi } from "./ui-state";

export function CategoryBanner({ category }: { category: string }) {
  const ui = useUi();
  const domain = DOMAINS.find((d) => d.label === category);
  const theme = domain ? THEMES[domain.id] : undefined;
  const { items, total, fresh } = useMemo(() => {
    const all = domain ? domainGlyphs(domain.id) : [];
    return { items: all.slice(0, 12), total: all.length, fresh: all.filter((g) => g.isNew).length };
  }, [domain]);
  if (!domain || !theme) return null;
  const tone = TONES[theme.tone];

  const tile = (g: GlyphData, size: number, box: string) => (
    <span key={g.slug} title={g.slug} className={cn("grid place-items-center rounded-2xl border bg-background/60 backdrop-blur", box)}>
      <Glyph nodes={g.nodes} variant={ui.variant} size={size} accent={ui.accent} className={tone.ink} />
    </span>
  );

  const art = (() => {
    switch (theme.motif) {
      case "hero":
        return (
          <div className="flex items-center gap-4">
            {items[0] && tile(items[0], 72, "size-32")}
            <div className="grid grid-cols-3 gap-2">{items.slice(1, 7).map((g) => tile(g, 28, "size-14"))}</div>
          </div>
        );
      case "wall":
        return <div className="grid -rotate-3 grid-cols-6 gap-2">{items.slice(0, 12).map((g) => tile(g, 28, "size-14"))}</div>;
      case "rows":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">{items.slice(0, 6).map((g) => tile(g, 28, "size-14"))}</div>
            <div className="flex translate-x-7 gap-2">{items.slice(6, 12).map((g) => tile(g, 28, "size-14"))}</div>
          </div>
        );
      case "stack":
        return <div className="flex -space-x-5">{items.slice(0, 6).map((g, i) => tile(g, 36, cn("size-20 shadow-lg", i % 2 ? "translate-y-3" : "-translate-y-1")))}</div>;
      case "scatter":
        return <div className="flex items-start gap-3">{items.slice(0, 8).map((g, i) => tile(g, 28, cn("size-14", SCATTER_OFFSET[i % SCATTER_OFFSET.length])))}</div>;
      case "line":
        return (
          <div className="flex items-center gap-2">
            {items.slice(0, 7).map((g, i) => (
              <span key={g.slug} className="flex items-center gap-2">
                {tile(g, 32, "size-16")}
                {i < 6 && <span className={cn("h-px w-4 bg-current opacity-40", tone.ink)} />}
              </span>
            ))}
          </div>
        );
    }
  })();

  return (
    <section className={cn("relative overflow-hidden rounded-3xl border bg-gradient-to-br via-transparent to-transparent p-6", tone.glow)}>
      <div className="relative grid items-center gap-6 xl:grid-cols-[minmax(0,24rem)_1fr]">
        <div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", tone.chip)}>
            <UiGlyph name={theme.icon} className="size-4" /> {total} icons{fresh > 0 ? `, ${fresh} new` : ""}
          </span>
          <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight md:text-3xl">{domain.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{theme.tagline}</p>
        </div>
        <div className="min-w-0 overflow-hidden pb-6 xl:justify-self-end">{art}</div>
      </div>
    </section>
  );
}
