"use client";

import { useState } from "react";
import { PaletteBar } from "./palette-bar";
import { cn } from "@/lib/utils";
import type { FlagTile } from "@/lib/flags-browser/model";

/** The flag's colors, right under its title: a thin strip in share order and hex chips that copy on click. */
export function FlagPalette({ colors, name }: Readonly<{ colors: FlagTile["colors"]; name: string }>) {
  const [copied, setCopied] = useState<string | null>(null);
  if (colors.length === 0) return null;
  const copy = (hex: string): void => {
    void navigator.clipboard?.writeText(`#${hex}`).then(() => {
      setCopied(hex);
      window.setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1500);
    }).catch(() => undefined);
  };
  return (
    <div className="mt-3" aria-label={`${name} flag colors`}>
      <PaletteBar colors={colors} className="h-2 w-full max-w-xs overflow-hidden rounded-full" />
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {colors.map((c) => (
          <li key={c.hex}>
            <button
              type="button"
              onClick={() => copy(c.hex)}
              title={`Copy #${c.hex}`}
              className={cn(
                "rounded-full border border-border/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground outline-none transition-colors hover:border-border hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                copied === c.hex && "border-foreground text-foreground",
              )}
            >
              {copied === c.hex ? "Copied" : `#${c.hex}`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
