"use client";

import { memo, useState } from "react";
import { UiGlyph } from "@/components/ui-glyph";
import { cn } from "@/lib/utils";
import { FLAG_SIZES, type FlagSize } from "@/lib/flags-browser/config";
import type { FlagTile as Tile, FlagVariantKey } from "@/lib/flags-browser/model";
import { PaletteBar } from "./palette-bar";

const FILE: Record<FlagVariantKey, string> = { "4x3": "default", square: "square", circle: "circle" };

export const flagSrc = (slug: string, variant: FlagVariantKey): string => `/icons/${slug}/${FILE[variant]}.svg`;

/** Explicit width and height so tiles never shift layout; the image is lazy and decoded off the main thread. */
export function flagDims(variant: FlagVariantKey, size: FlagSize): { width: number; height: number } {
  const height = FLAG_SIZES[size];
  return { width: variant === "4x3" ? Math.round((height * 4) / 3) : height, height };
}

interface Props {
  tile: Tile;
  variant: FlagVariantKey;
  size: FlagSize;
  starred: boolean;
  tabIndex: number;
  onOpen: (code: string) => void;
  onToggleStar: (code: string) => void;
}

function FlagTileImpl({ tile, variant, size, starred, tabIndex, onOpen, onToggleStar }: Props) {
  const { width, height } = flagDims(variant, size);
  const [copied, setCopied] = useState(false);
  const detail = [tile.native && tile.native !== tile.name ? tile.native : null, tile.iso, tile.alpha3, tile.emoji].filter(Boolean).join(" ");
  const src = flagSrc(tile.slug, variant);
  const copySvg = (): void => {
    void fetch(src)
      .then((r) => r.text())
      .then((svg) => navigator.clipboard.writeText(svg))
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => undefined);
  };
  const action = "flex h-8 flex-1 items-center justify-center gap-1 rounded-lg text-xs text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <li className="group relative [content-visibility:auto] [contain-intrinsic-size:auto_210px]" data-flag-tile={tile.code}>
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card/80 shadow-sm shadow-black/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-border/70 hover:shadow-lg hover:shadow-black/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
        {/* A plain click goes to the flag's own page; quick view is the eye button below. */}
        <a
          href={`/icon/${tile.slug}`}
          tabIndex={tabIndex}
          data-flag-button={tile.code}
          title={detail}
          aria-label={`${tile.name}${tile.iso ? ` ${tile.iso}` : ""}`}
          className="flex flex-1 flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="icon-preview-bg flex h-24 w-full items-center justify-center">
            <img src={src} alt="" width={width} height={height} loading="lazy" decoding="async" className="object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none" />
          </span>
          <span className="mt-2 line-clamp-2 px-2 text-center text-sm font-medium leading-tight">{tile.name}</span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">{tile.iso ?? tile.code.toUpperCase()}</span>
          <PaletteBar colors={tile.colors} className="mx-3 mb-2.5 mt-2 h-1 w-[calc(100%-1.5rem)] rounded-full" />
        </a>
        <div className="flex items-center gap-0.5 border-t border-border/20 px-1.5 py-1 dark:border-white/[0.04]">
          <button type="button" tabIndex={-1} onClick={copySvg} aria-label={`Copy ${tile.name} SVG`} className={action}>
            <UiGlyph name="copy" className="size-3.5" />
            {copied ? "Copied" : "Copy"}
          </button>
          <a href={src} download={`${tile.slug}-${FILE[variant]}.svg`} tabIndex={-1} aria-label={`Download ${tile.name} SVG`} className={cn(action, "max-w-9")}>
            <UiGlyph name="download" className="size-3.5" />
          </a>
          <button type="button" tabIndex={-1} onClick={() => onOpen(tile.code)} aria-label={`Quick view ${tile.name}`} title="Quick view" className={cn(action, "max-w-9")}>
            <UiGlyph name="eye" className="size-3.5" />
          </button>
        </div>
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-pressed={starred}
        aria-label={starred ? `Remove ${tile.name} from starred` : `Star ${tile.name}`}
        onClick={() => onToggleStar(tile.code)}
        className={cn("absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground opacity-0 outline-none transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100", starred && "text-amber-500 opacity-100")}
      >
        <UiGlyph name="star" className="size-4" />
      </button>
    </li>
  );
}

export const FlagTileCard = memo(FlagTileImpl);
