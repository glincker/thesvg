"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UiGlyph } from "@/components/ui-glyph";
import { describeColor, readableOn } from "@/lib/flags-browser/color";
import type { FlagTile, FlagVariantKey } from "@/lib/flags-browser/model";
import { copyText, imgTag, installLine, reactImport } from "@/lib/flags-browser/snippets";
import { flagSrc } from "./flag-tile";

const VARIANTS: { key: FlagVariantKey; label: string; file: "default" | "square" | "circle"; w: number; h: number }[] = [
  { key: "4x3", label: "4x3", file: "default", w: 64, h: 48 },
  { key: "square", label: "Square", file: "square", w: 48, h: 48 },
  { key: "circle", label: "Circle", file: "circle", w: 48, h: 48 },
];

interface Props {
  tile: FlagTile | null;
  similar: FlagTile[];
  variant: FlagVariantKey;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function FlagPanel({ tile, similar, variant, onSelect, onClose }: Props) {
  const [status, setStatus] = useState("");
  useEffect(() => setStatus(""), [tile?.code]);

  const copy = async (label: string, text: string): Promise<void> => {
    setStatus((await copyText(text)) ? `Copied ${label}` : `Could not copy ${label}`);
  };
  const copySvg = async (v: (typeof VARIANTS)[number]): Promise<void> => {
    if (!tile) return;
    try {
      const res = await fetch(flagSrc(tile.slug, v.key));
      await copy("SVG", await res.text());
    } catch {
      setStatus("Could not copy SVG");
    }
  };

  return (
    <Dialog open={tile !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {tile ? (
          <>
            <DialogHeader>
              <DialogTitle>{tile.name}</DialogTitle>
              <a href={`/icon/${tile.slug}`} className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-orange-500 underline-offset-2 hover:underline">
                Open the {tile.name} flag page
                <UiGlyph name="arrow-right" className="size-3" />
              </a>
              <DialogDescription>
                {[tile.native && tile.native !== tile.name ? tile.native : null, tile.iso, tile.alpha3, tile.numeric, tile.emoji].filter(Boolean).join(" · ")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3">
              {VARIANTS.map((v) => (
                <div key={v.key} className="flex flex-col items-center gap-2 rounded-lg border border-border/40 p-3">
                  <img src={flagSrc(tile.slug, v.key)} alt="" width={v.w} height={v.h} loading="lazy" decoding="async" className="object-contain" />
                  <span className="text-xs text-muted-foreground">{v.label}{v.key === variant ? " (selected)" : ""}</span>
                  <div className="flex gap-1">
                    <Button type="button" size="xs" variant="outline" onClick={() => copySvg(v)} aria-label={`Copy ${v.label} SVG`}>
                      <UiGlyph name="copy" className="size-3" /> SVG
                    </Button>
                    <a
                      href={flagSrc(tile.slug, v.key)}
                      download={`${tile.slug}-${v.file}.svg`}
                      aria-label={`Download ${v.label} SVG`}
                      className="inline-flex h-6 items-center gap-1 rounded-md border border-border px-2 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <UiGlyph name="download" className="size-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => copy("React import", reactImport(tile.code))}>React import</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => copy("install command", installLine)}>Install</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => copy("img tag", imgTag(tile.slug, tile.name, VARIANTS.find((v) => v.key === variant)!.file, 32, variant === "4x3" ? 24 : 32))}>img tag</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => copy("slug", tile.slug)}>Slug</Button>
            </div>
            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">{status || " "}</p>

            <section aria-label="Palette">
              <h3 className="mb-2 text-xs font-semibold">Colors</h3>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tile.colors.map((c) => {
                  const d = describeColor(c.hex);
                  const r = readableOn(c.hex);
                  return (
                    <li key={c.hex}>
                      <button type="button" onClick={() => copy(d.hex, d.hex)} aria-label={`Copy ${d.hex}, ${c.share} percent of the flag`} className="flex w-full flex-col gap-1 rounded-lg border border-border/40 p-2 text-left text-[11px] outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                        <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full rounded" role="img" aria-label={`${d.hex} swatch`}>
                          <rect width="100" height="28" fill={d.hex} />
                        </svg>
                        <span className="flex items-baseline justify-between font-mono"><span>{d.hex}</span><span className="text-muted-foreground">{c.share}%</span></span>
                        <span className="text-muted-foreground">{d.rgb}</span>
                        <span className="text-muted-foreground">{d.hsl}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-1 text-[11px] text-muted-foreground">Families: {tile.colorNames.join(", ") || "none"}</p>
            </section>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {tile.credits.length > 0 ? (
                <>
                  Credits: {tile.credits.map((c) => `${c.variant} from ${c.source} (${c.license}, ${c.file})`).join("; ")}. Any other variant comes from flag-icons or circle-flags, both MIT.{" "}
                </>
              ) : (
                <>License: the 4x3 and square files come from flag-icons and the circle file from circle-flags, both MIT. </>
              )}
              Notices are in THIRD_PARTY_NOTICES.md. A flag is a public symbol of a state or organization; this is not a statement about sovereignty.
            </p>

            {similar.length > 0 ? (
              <section aria-label="Same region">
                <h3 className="mb-2 text-xs font-semibold">Same region</h3>
                <ul className="flex flex-wrap gap-2">
                  {similar.map((s) => (
                    <li key={s.code}>
                      <button type="button" onClick={() => onSelect(s.code)} aria-label={s.name} title={s.name} className="rounded-md border border-border/40 p-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                        <img src={flagSrc(s.slug, variant)} alt="" width={variant === "4x3" ? 32 : 24} height={24} loading="lazy" decoding="async" className="object-contain" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
