"use client";

import { UiGlyph } from "@/components/ui-glyph";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { type Glyph as GlyphData, VARIANTS } from "@/lib/ui-icons/glyphs";
import type { Variant } from "@/lib/ui-icons/engine";
import { codeFor } from "@/lib/ui-icons/snippets";
import { cn } from "@/lib/ui-icons/utils";
import { Glyph, svgText } from "./glyph";
import { useUi } from "./ui-state";

/** Quick preview in a modal, the same pattern thesvg uses for brand icons. The full page stays one click away. */
export function QuickView({ glyph, onClose }: { glyph: GlyphData; onClose: () => void }) {
  const ui = useUi();
  const [look, setLook] = useState<Variant>(ui.variant);
  const [done, setDone] = useState<string | null>(null);
  const fav = ui.favorites.includes(glyph.slug);

  const copy = async (key: "svg" | "react") => {
    const svg = svgText(glyph.nodes, look, 24, ui.accent, ui.lab);
    try {
      await navigator.clipboard.writeText(key === "svg" ? svg : codeFor("react", svg, glyph.slug));
      setDone(key);
      window.setTimeout(() => setDone(null), 1400);
    } catch {
      setDone(null);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([svgText(glyph.nodes, look, 24, ui.accent, ui.lab)], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${glyph.slug}-${look}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-1rem)] gap-0 overflow-hidden rounded-2xl border-border/30 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-lg">
        <DialogTitle className="sr-only">{glyph.slug}</DialogTitle>
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="relative flex items-center justify-center bg-gradient-to-b from-foreground/[0.07] to-transparent px-8 py-10">
            <Glyph nodes={glyph.nodes} variant={look} size={112} accent={ui.accent} className="text-foreground" />
            <button
              type="button"
              aria-label={fav ? "Remove favorite" : "Add favorite"}
              onClick={() => ui.toggleFavorite(glyph.slug)}
              className={cn("absolute left-3 top-3 grid size-7 place-items-center rounded-full bg-background/60 text-muted-foreground backdrop-blur-sm hover:text-foreground", fav && "text-orange-500")}
            >
              <UiGlyph name="heart" look={fav ? "fill" : "outline"} className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h2 className="text-base font-semibold">{glyph.slug}</h2>
              <p className="text-xs text-muted-foreground">{glyph.category} · {glyph.tags.slice(0, 4).join(", ")}</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {VARIANTS.map((v) => (
                <button key={v} type="button" onClick={() => setLook(v)} aria-pressed={look === v} className={cn("flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] capitalize text-muted-foreground transition-colors hover:text-foreground", look === v && "border-orange-500/50 text-foreground")}>
                  <Glyph nodes={glyph.nodes} variant={v} size={22} accent={ui.accent} className="text-foreground" />
                  {v}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <button type="button" onClick={() => copy("svg")} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-foreground text-xs font-medium text-background">
                {done === "svg" ? <UiGlyph name="check" className="size-3.5" /> : <UiGlyph name="copy" className="size-3.5" />} Copy SVG
              </button>
              <button type="button" onClick={() => copy("react")} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium hover:bg-accent">
                {done === "react" ? <UiGlyph name="check" className="size-3.5" /> : <UiGlyph name="copy" className="size-3.5" />} Copy React
              </button>
              <button type="button" aria-label="Download SVG" onClick={download} className="grid size-9 place-items-center rounded-lg border hover:bg-accent">
                <UiGlyph name="download" className="size-3.5" />
              </button>
            </div>
            <Link href={`/ui/${glyph.slug}`} onClick={onClose} className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              Open full page <UiGlyph name="arrow-right" className="size-3.5" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
