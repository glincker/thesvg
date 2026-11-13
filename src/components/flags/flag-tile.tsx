"use client";

import { memo } from "react";
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
  const detail = [tile.native && tile.native !== tile.name ? tile.native : null, tile.iso, tile.alpha3, tile.emoji].filter(Boolean).join(" ");
  return (
    <li className="group relative [content-visibility:auto] [contain-intrinsic-size:auto_132px]" data-flag-tile={tile.code}>
      <a
        href={`/icon/${tile.slug}`}
        tabIndex={tabIndex}
        data-flag-button={tile.code}
        onClick={(e) => {
          // A plain click opens the quick panel; modified clicks and crawlers follow the real page.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          onOpen(tile.code);
        }}
        title={detail}
        aria-label={`${tile.name}${tile.iso ? `, ${tile.iso}` : ""}`}
        className="flex w-full flex-col items-center gap-2 rounded-xl border border-border/40 bg-card/30 p-3 pb-2 text-center outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none dark:border-white/[0.06] dark:bg-white/[0.02]"
      >
        <span className="flex h-16 items-center justify-center">
          <img src={flagSrc(tile.slug, variant)} alt="" width={width} height={height} loading="lazy" decoding="async" className="object-contain" />
        </span>
        <span className="line-clamp-2 text-xs font-medium leading-tight">{tile.name}</span>
        <span className="text-[10px] text-muted-foreground">{tile.iso ?? tile.code.toUpperCase()}</span>
        <PaletteBar colors={tile.colors} className="h-1 w-full rounded-full" />
      </a>
      <button
        type="button"
        tabIndex={-1}
        aria-pressed={starred}
        aria-label={starred ? `Remove ${tile.name} from starred` : `Star ${tile.name}`}
        onClick={() => onToggleStar(tile.code)}
        className={cn("absolute right-1 top-1 rounded-md p-1 text-muted-foreground opacity-0 outline-none transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 motion-reduce:transition-none", starred && "text-amber-500 opacity-100")}
      >
        <UiGlyph name="star" className="size-4" />
      </button>
    </li>
  );
}

export const FlagTileCard = memo(FlagTileImpl);
