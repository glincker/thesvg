"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { getFlagForLocale } from "../../../packages/flags/src/locale";
import type { FlagTile, FlagVariantKey } from "@/lib/flags-browser/model";
import { copyText, reactImport } from "@/lib/flags-browser/snippets";
import { flagSrc } from "./flag-tile";

/** Best guess from navigator.languages: the first entry that maps to a flag we have. Local only, nothing is sent anywhere. */
export function detectFlag(languages: readonly string[], tiles: readonly FlagTile[]): FlagTile | undefined {
  for (const l of languages) {
    const hit = getFlagForLocale(l);
    const tile = hit && tiles.find((t) => t.code === hit.code);
    if (tile) return tile;
  }
  return undefined;
}

const subscribeNever = (): (() => void) => () => undefined;
const browserLanguages = (): string => (navigator.languages && navigator.languages.length > 0 ? [...navigator.languages] : [navigator.language]).filter(Boolean).join(",");

interface Props {
  tiles: readonly FlagTile[];
  variant: FlagVariantKey;
  onOpen: (code: string) => void;
}

export function YourFlagCard({ tiles, variant, onOpen }: Props) {
  const [status, setStatus] = useState("");
  // Empty on the server and during hydration, then the browser's own list; the store never changes.
  const languages = useSyncExternalStore(subscribeNever, browserLanguages, () => "");
  const tile = useMemo(() => (languages ? detectFlag(languages.split(","), tiles) : undefined), [languages, tiles]);
  if (!tile) return null;

  const copySvg = async (): Promise<void> => {
    try {
      const res = await fetch(flagSrc(tile.slug, variant));
      setStatus((await copyText(await res.text())) ? "Copied SVG" : "Could not copy SVG");
    } catch {
      setStatus("Could not copy SVG");
    }
  };

  return (
    <section aria-label="Your flag" className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-border/40 bg-card/30 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]" data-testid="your-flag">
      <img src={flagSrc(tile.slug, variant)} alt="" width={variant === "4x3" ? 64 : 48} height={48} decoding="async" className="object-contain" />
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold">Your flag: {tile.name}</h2>
        <p className="text-xs text-muted-foreground">Guessed from your browser language, on your device only. A flag is a country, not a language.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={async () => setStatus((await copyText(reactImport(tile.code))) ? "Copied import" : "Could not copy import")}>Copy import</Button>
        <Button type="button" size="sm" variant="secondary" onClick={copySvg}>Copy SVG</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onOpen(tile.code)}>Details</Button>
      </div>
      <p className="w-full text-xs text-muted-foreground" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
