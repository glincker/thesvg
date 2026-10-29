"use client";

import { defaultColorOf } from "@/lib/ui-icons/default-color";
import { UiGlyph } from "@/components/ui-glyph";
import Link from "next/link";
import { useState } from "react";
import { formatSvg } from "@/lib/copy-formats";
import { COPY_LABEL, copyText } from "@/lib/ui-icons/copy-target";
import { useSettingsStore } from "@/lib/stores/settings-store";
import type { Glyph as GlyphData } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { Glyph, svgText } from "./glyph";
import { QuickView } from "./quick-view";
import { useUi } from "./ui-state";

export function IconCard({ glyph }: { glyph: GlyphData }) {
  const ui = useUi();
  // in: the confirmation is showing, out: it is fading, so it never pops away.
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");
  const copied = phase !== "idle";
  const [preview, setPreview] = useState(false);
  const defaultCopyFormat = useSettingsStore((st) => st.defaultCopyFormat);
  const previewBackground = useSettingsStore((st) => st.previewBackground);
  const fav = ui.favorites.includes(glyph.slug);

  const copy = async () => {
    try {
      const svg = svgText(glyph.nodes, ui.variant, 24, ui.accent, ui.lab, glyph.slug);
      // UI icons are not on the brand CDN, so the CDN format falls back to raw SVG.
      const shaped = formatSvg(svg, defaultCopyFormat === "cdn" ? "svg" : defaultCopyFormat, glyph.slug, ui.variant);
      await navigator.clipboard.writeText(copyText(ui.copyTarget, { svg: shaped, slug: glyph.slug, look: ui.variant }));
      setPhase("in");
      window.setTimeout(() => setPhase("out"), 1100);
      window.setTimeout(() => setPhase("idle"), 1450);
    } catch {
      setPhase("idle");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([svgText(glyph.nodes, ui.variant, 24, ui.accent, ui.lab, glyph.slug)], { type: "image/svg+xml" }));
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
      <Link href={`/ui/${glyph.slug}`} data-preview={previewBackground} onClick={(e) => { if (ui.clickToCopy) { e.preventDefault(); void copy(); } }} title={ui.clickToCopy ? `Click to copy ${COPY_LABEL[ui.copyTarget]}` : undefined} className={cn("relative flex h-24 items-center justify-center", previewBackground === "light" ? "text-neutral-900" : previewBackground === "dark" ? "text-neutral-50" : (ui.colorMode === "natural" && !ui.accent && defaultColorOf(glyph.slug)) || "text-foreground", previewBackground === "auto" ? "bg-gradient-to-b from-foreground/[0.07] to-transparent" : "icon-preview-bg")}>
        {copied && (
          <span aria-live="polite" className={cn("pointer-events-none absolute inset-0 z-10 grid place-items-center bg-background/80 backdrop-blur-sm duration-200", phase === "in" ? "animate-in fade-in" : "animate-out fade-out fill-mode-forwards")}>
            <span className="flex flex-col items-center gap-1.5 animate-in zoom-in-75 duration-300">
              <span className="relative grid size-9 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <span aria-hidden="true" className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                <UiGlyph name="check" look="outline" className="relative size-5 text-white" />
              </span>
              <span className="text-[0.75rem] font-medium text-foreground">Copied {COPY_LABEL[ui.copyTarget]}</span>
            </span>
          </span>
        )}
        <Glyph nodes={glyph.nodes} variant={ui.variant} size={44} accent={ui.accent} className="transition-transform duration-200 group-hover/card:scale-110" />
        {!glyph.released && (
          <span className={cn("absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[0.75rem] font-medium", "border-foreground/15 bg-background/60 text-muted-foreground")}>
            {glyph.setId === "backlog" ? "Backlog" : "Draft"}
          </span>
        )}
        <button
          type="button"
          aria-label={fav ? "Remove favorite" : "Add favorite"}
          onClick={(e) => { e.preventDefault(); ui.toggleFavorite(glyph.slug); }}
          className={cn("absolute right-2 top-2 grid size-7 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/card:opacity-100", fav && "text-orange-500 opacity-100")}
        >
          <UiGlyph name="heart" look={fav ? "fill" : "outline"} className="size-4" />
        </button>
      </Link>
      <div className="px-3 pb-1.5 pt-2.5 text-center">
        <Link href={`/ui/${glyph.slug}`} className="block truncate text-[0.8125rem] font-medium hover:text-orange-500">{glyph.slug}</Link>
        <div className="truncate text-[0.75rem] text-muted-foreground">{glyph.category}</div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] border-t text-[0.75rem] text-muted-foreground opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/card:opacity-100 [@media(hover:none)]:opacity-100">
        <button type="button" onClick={copy} className="flex items-center justify-center gap-1.5 py-1.5 transition-colors hover:bg-accent hover:text-foreground">
          {copied ? <UiGlyph name="check" className="size-4 text-emerald-400" /> : <UiGlyph name="copy" className="size-4" />}
          {copied ? "Copied" : `Copy ${COPY_LABEL[ui.copyTarget]}`}
        </button>
        <button type="button" aria-label="Download SVG" onClick={download} className="px-3 py-2 transition-colors hover:bg-accent hover:text-foreground">
          <UiGlyph name="download" className="size-4" />
        </button>
        <button type="button" aria-label="Quick preview" onClick={() => setPreview(true)} className="px-3 py-2 transition-colors hover:bg-accent hover:text-foreground">
          <UiGlyph name="eye" className="size-4" />
        </button>
      </div>
      {preview && <QuickView glyph={glyph} onClose={() => setPreview(false)} />}
    </div>
  );
}
