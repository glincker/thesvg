"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { loadIconsManifest } from "@/lib/icons-manifest";
import type { IconEntry } from "@/lib/icons";

interface MobileRecentsRowProps {
  /** Optional label shown above the row. Defaults to "Recent". */
  label?: string;
  /** Max tiles to show. Defaults to 12. */
  limit?: number;
}

/**
 * Mobile-only pinned recents row. Renders a single-line horizontal
 * carousel of recently viewed icons. Returns `null` when there are no
 * recents so it doesn't take vertical space on a first visit.
 *
 * Consumed by collection landing pages via the mobile shell — desktop
 * keeps its existing recents surfaces in the header dropdown.
 */
export function MobileRecentsRow({
  label = "Recent",
  limit = 12,
}: MobileRecentsRowProps) {
  const viewed = useRecentsStore((s) => s.viewed);
  const [icons, setIcons] = useState<IconEntry[]>([]);

  useEffect(() => {
    if (viewed.length === 0) {
      setIcons([]);
      return;
    }
    let active = true;
    loadIconsManifest()
      .then((manifest) => {
        if (!active) return;
        const bySlug = new Map(manifest.map((i) => [i.slug, i]));
        const resolved = viewed
          .map((v) => bySlug.get(v.slug))
          .filter((i): i is IconEntry => Boolean(i))
          .slice(0, limit);
        setIcons(resolved);
      })
      .catch(() => {
        if (active) setIcons([]);
      });
    return () => {
      active = false;
    };
  }, [viewed, limit]);

  if (icons.length === 0) return null;

  return (
    <section
      aria-label="Recently viewed icons"
      className="lg:hidden"
    >
      <div className="flex items-center justify-between px-3 pb-2">
        <h3 className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3 w-3" /> {label}
        </h3>
        <Link
          href="/recents"
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          See all
        </Link>
      </div>
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-3 pb-3 scrollbar-none snap-x snap-mandatory">
        {icons.map((icon) => (
          <li key={icon.slug} className="shrink-0 snap-start">
            <Link
              href={`/icon/${icon.slug}`}
              className="flex w-16 flex-col items-center gap-1 rounded-xl border border-border/30 bg-card/60 p-2"
              aria-label={icon.title}
            >
              <span className="icon-preview-bg flex h-10 w-10 items-center justify-center rounded-lg">
                <img
                  src={icon.variants.default}
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              </span>
              <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                {icon.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
