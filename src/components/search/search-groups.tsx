"use client";

import { UiGlyph } from "@/components/ui-glyph";
import Link from "next/link";
import type { IconEntry } from "@/lib/icons";
import { type Glyph, styleFor } from "@/lib/ui-icons/glyphs";
import { renderIcon } from "@/lib/ui-icons/engine";
import { cn } from "@/lib/ui-icons/utils";

/** Static glyph for places outside the UI section, where the shared style state is not available. */
function StaticGlyph({ glyph, size }: { glyph: Glyph; size: number }) {
  const svg = renderIcon(glyph.nodes, { variant: "outline", style: styleFor("outline"), size, idPrefix: `sg-${glyph.slug}` }).svg;
  return <span aria-hidden="true" className="shrink-0 text-foreground" dangerouslySetInnerHTML={{ __html: svg }} />;
}

interface Props {
  primary: "brand" | "ui";
  brands: IconEntry[];
  brandTotal: number;
  uiGlyphs: Glyph[];
  uiTotal: number;
  query: string;
  loading: boolean;
  error: boolean;
  selectedIdx: number;
  optionId: string;
  onHover: (i: number) => void;
  onPickBrand: (slug: string) => void;
  onPickUi: (slug: string) => void;
  onClose: () => void;
}

const rowClass = (active: boolean) =>
  cn(
    "group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-all duration-150",
    active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50",
  );

/** Results for both libraries. The one you are browsing leads on the left, the other sits beside it. */
export function SearchGroups(p: Props) {
  const brandRows = p.brands.map((icon, i) => ({ key: `b-${icon.slug}`, kind: "brand" as const, icon, i }));
  const uiRows = p.uiGlyphs.map((glyph, i) => ({ key: `u-${glyph.slug}`, kind: "ui" as const, glyph, i }));
  const groups =
    p.primary === "brand"
      ? [
          { id: "brand" as const, title: "Brand icons", total: p.brandTotal, rows: brandRows, all: `/?q=${encodeURIComponent(p.query)}` },
          { id: "ui" as const, title: "UI icons", total: p.uiTotal, rows: uiRows, all: `/ui?q=${encodeURIComponent(p.query)}` },
        ]
      : [
          { id: "ui" as const, title: "UI icons", total: p.uiTotal, rows: uiRows, all: `/ui?q=${encodeURIComponent(p.query)}` },
          { id: "brand" as const, title: "Brand icons", total: p.brandTotal, rows: brandRows, all: `/?q=${encodeURIComponent(p.query)}` },
        ];
  let offset = 0;
  const placed = groups.map((g) => {
    const start = offset;
    offset += g.rows.length;
    return { ...g, start };
  });
  const nothing = brandRows.length === 0 && uiRows.length === 0;

  if (nothing && p.loading) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <UiGlyph name="search" className="h-6 w-6 animate-pulse text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Searching&hellip;</p>
      </div>
    );
  }
  if (nothing && p.error) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">Search failed to load. Check your connection and try again.</p>;
  }
  if (nothing) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <UiGlyph name="search" className="h-6 w-6 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No icons match &ldquo;{p.query.trim()}&rdquo;</p>
        <Link href="/submit" onClick={p.onClose} className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400">Submit this icon</Link>
      </div>
    );
  }

  return (
    <div className={cn("grid", brandRows.length > 0 && uiRows.length > 0 && "sm:grid-cols-[1.35fr_1fr]")}>
      {placed.map((g, gi) =>
        g.rows.length === 0 ? null : (
          <div key={g.id} className={cn("min-w-0 px-2 py-1.5", gi > 0 && "border-t border-border/30 bg-muted/20 sm:border-l sm:border-t-0 dark:border-white/[0.05] dark:bg-white/[0.02]")}>
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {g.title} <span className="ml-1 text-muted-foreground/40">{g.total.toLocaleString()}</span>
              </p>
              {gi === 0 && <span className="rounded-full bg-orange-500/10 px-1.5 py-px text-[9px] font-medium text-orange-500">This section</span>}
            </div>
            {g.rows.map((r, ri) => {
              const idx = g.start + ri;
              const active = idx === p.selectedIdx;
              if (r.kind === "brand") {
                return (
                  <button key={r.key} id={`${p.optionId}-${idx}`} type="button" role="option" aria-selected={active} onMouseEnter={() => p.onHover(idx)} onClick={() => p.onPickBrand(r.icon.slug)} className={rowClass(active)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.icon.variants.default} alt="" className="h-6 w-6 shrink-0 rounded object-contain transition-transform duration-150 group-hover:scale-110" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.icon.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{r.icon.categories[0] || r.icon.slug}</span>
                    </span>
                  </button>
                );
              }
              return (
                <button key={r.key} id={`${p.optionId}-${idx}`} type="button" role="option" aria-selected={active} onMouseEnter={() => p.onHover(idx)} onClick={() => p.onPickUi(r.glyph.slug)} className={rowClass(active)}>
                  <span className="grid size-6 shrink-0 place-items-center transition-transform duration-150 group-hover:scale-110"><StaticGlyph glyph={r.glyph} size={22} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.glyph.slug}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{r.glyph.category}</span>
                  </span>
                </button>
              );
            })}
            {g.total > g.rows.length && (
              <Link href={g.all} onClick={p.onClose} className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
                View all {g.total.toLocaleString()} <UiGlyph name="arrow-right" className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ),
      )}
    </div>
  );
}
