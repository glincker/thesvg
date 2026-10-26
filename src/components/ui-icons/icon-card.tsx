"use client";

import { Check, Copy, Download, Eye, Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Glyph as GlyphData } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { Glyph, svgText } from "./glyph";
import { QuickView } from "./quick-view";
import { useUi } from "./ui-state";

export function IconCard({ glyph }: { glyph: GlyphData }) {
  const ui = useUi();
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const fav = ui.favorites.includes(glyph.slug);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(svgText(glyph.nodes, ui.variant, 24, ui.accent, ui.lab));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([svgText(glyph.nodes, ui.variant, 24, ui.accent, ui.lab)], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${glyph.slug}-${ui.variant}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div onPointerEnter={() => ui.setSample(glyph.slug)} className="group/card relative overflow-hidden rounded-2xl border bg-card/60 transition-[border-color,box-shadow] duration-300 hover:border-orange-500/30 hover:shadow-[0_12px_30px_-14px_rgba(249,115,22,0.35)] motion-reduce:transition-none">
      {/* Light from the top edge that fades in on hover, the same lit-glass cue the look tiles use. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-0 transition-opacity duration-300 [background:radial-gradient(ellipse_70%_100%_at_50%_0%,rgba(249,115,22,0.22),transparent_72%)] group-hover/card:opacity-100" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
      <Link href={`/ui/${glyph.slug}`} className="relative flex h-24 items-center justify-center bg-gradient-to-b from-foreground/[0.07] to-transparent">
        <Glyph nodes={glyph.nodes} variant={ui.variant} size={44} accent={ui.accent} className="text-foreground transition-transform duration-200 group-hover/card:scale-110" />
        {!glyph.released && (
          <span className={cn("absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-medium", "border-foreground/15 bg-background/60 text-muted-foreground")}>
            {glyph.setId === "backlog" ? "Backlog" : "Draft"}
          </span>
        )}
        <button
          type="button"
          aria-label={fav ? "Remove favorite" : "Add favorite"}
          onClick={(e) => { e.preventDefault(); ui.toggleFavorite(glyph.slug); }}
          className={cn("absolute right-2 top-2 grid size-7 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/card:opacity-100", fav && "text-orange-500 opacity-100")}
        >
          <Heart className={cn("size-3.5", fav && "fill-current")} />
        </button>
      </Link>
      <div className="px-3 pb-1.5 pt-2.5 text-center">
        <div className="truncate text-[13px] font-medium">{glyph.slug}</div>
        <div className="truncate text-[11px] text-muted-foreground">{glyph.category}</div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] border-t text-[11px] text-muted-foreground opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/card:opacity-100 [@media(hover:none)]:opacity-100">
        <button type="button" onClick={copy} className="flex items-center justify-center gap-1.5 py-1.5 transition-colors hover:bg-accent hover:text-foreground">
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" aria-label="Download SVG" onClick={download} className="px-3 py-2 transition-colors hover:bg-accent hover:text-foreground">
          <Download className="size-3.5" />
        </button>
        <button type="button" aria-label="Quick preview" onClick={() => setPreview(true)} className="px-3 py-2 transition-colors hover:bg-accent hover:text-foreground">
          <Eye className="size-3.5" />
        </button>
      </div>
      {preview && <QuickView glyph={glyph} onClose={() => setPreview(false)} />}
    </div>
  );
}
