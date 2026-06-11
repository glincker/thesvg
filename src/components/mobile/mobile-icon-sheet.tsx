"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Check, Copy, Download, ExternalLink, Heart } from "lucide-react";
import { BottomSheet } from "./bottom-sheet";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { loadIconsManifest } from "@/lib/icons-manifest";
import { formatSvg, type CopyFormat } from "@/lib/copy-formats";
import type { IconEntry } from "@/lib/icons";
import { cn } from "@/lib/utils";

const COPY_FORMATS: ReadonlyArray<{ key: CopyFormat | "png"; label: string }> = [
  { key: "svg", label: "SVG" },
  { key: "jsx", label: "JSX" },
  { key: "vue", label: "Vue" },
  { key: "cdn", label: "CDN" },
  { key: "png", label: "PNG" },
];

/**
 * Bottom-sheet icon detail for mobile. Opens when the user taps an icon
 * tile inside the mobile shell — preview, copy-format chips, swipe-down
 * to dismiss, deep link still hits the full `/icon/[slug]` page directly.
 */
export function MobileIconSheet() {
  const router = useRouter();
  const sheet = useMobileShellStore((s) => s.sheet);
  const slug = useMobileShellStore((s) => s.iconSlug);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);
  const recordView = useRecentsStore((s) => s.recordView);
  const recordCopy = useRecentsStore((s) => s.recordCopy);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) =>
    slug ? s.favorites.includes(slug) : false,
  );

  const [icon, setIcon] = useState<IconEntry | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const open = sheet === "icon";
  const recordedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !slug) {
      setIcon(null);
      return;
    }
    let active = true;
    loadIconsManifest()
      .then((icons) => {
        if (!active) return;
        const match = icons.find((i) => i.slug === slug) ?? null;
        setIcon(match);
      })
      .catch(() => {
        if (active) setIcon(null);
      });
    return () => {
      active = false;
    };
  }, [open, slug]);

  // Record view exactly once per open
  useEffect(() => {
    if (!open || !slug) return;
    if (recordedRef.current === slug) return;
    recordedRef.current = slug;
    recordView(slug);
  }, [open, slug, recordView]);

  // Reset the recorded marker when the sheet closes
  useEffect(() => {
    if (!open) recordedRef.current = null;
  }, [open]);

  const handleCopy = useCallback(
    async (key: CopyFormat | "png") => {
      if (!icon) return;
      try {
        if (key === "png") {
          // Defer to the full detail page for PNG export (canvas rasterizer).
          router.push(`/icon/${icon.slug}#export`);
          closeSheet();
          return;
        }
        const res = await fetch(icon.variants.default);
        const svg = await res.text();
        const out = formatSvg(svg, key, icon.slug, "default");
        await navigator.clipboard.writeText(out);
        recordCopy(icon.slug, key);
        posthog.capture("icon_copied", {
          icon_slug: icon.slug,
          icon_title: icon.title,
          format: key,
          source: "mobile_sheet",
          categories: icon.categories,
        });
        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey(null), 1400);
      } catch {
        // Clipboard rejected — fall back to opening the icon URL
        window.open(icon.variants.default, "_blank");
      }
    },
    [icon, recordCopy, router, closeSheet],
  );

  const handleDownload = useCallback(async () => {
    if (!icon) return;
    try {
      const res = await fetch(icon.variants.default);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${icon.slug}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      posthog.capture("icon_downloaded", {
        icon_slug: icon.slug,
        icon_title: icon.title,
        variant: "default",
        file_type: "svg",
        source: "mobile_sheet",
      });
    } catch {
      window.open(icon.variants.default, "_blank");
    }
  }, [icon]);

  return (
    <BottomSheet
      open={open}
      onClose={closeSheet}
      fixedSnap="half"
      label={icon?.title ?? "Icon"}
    >
      {icon ? (
        <div className="flex h-full flex-col">
          <div
            className="icon-preview-bg relative mx-4 flex h-44 items-center justify-center rounded-2xl"
            style={{ touchAction: "pinch-zoom" }}
          >
            <img
              src={icon.variants.default}
              alt={`${icon.title} icon preview`}
              className="h-24 w-24 object-contain"
              draggable={false}
            />
            <button
              type="button"
              onClick={() => toggleFavorite(icon.slug)}
              aria-label={
                isFavorite
                  ? `Remove ${icon.title} from favorites`
                  : `Add ${icon.title} to favorites`
              }
              aria-pressed={isFavorite}
              className={cn(
                "absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/80 backdrop-blur-md transition-colors",
                isFavorite
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Heart
                className={cn("h-4 w-4", isFavorite && "fill-current")}
              />
            </button>
          </div>

          <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none">
            {COPY_FORMATS.map((fmt) => {
              const copied = copiedKey === fmt.key;
              return (
                <button
                  key={fmt.key}
                  type="button"
                  onClick={() => handleCopy(fmt.key)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    copied
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border/50 bg-card/60 text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground",
                  )}
                >
                  {copied ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="h-3 w-3" /> Copied
                    </span>
                  ) : (
                    fmt.label
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2 px-4">
            <button
              type="button"
              onClick={() => handleCopy("svg")}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              <Copy className="h-4 w-4" /> Copy SVG
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Download SVG"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 px-4">
            <Link
              href={`/icon/${icon.slug}`}
              onClick={() => closeSheet()}
              className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="font-medium">Open full details</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 px-4 pb-4 text-[11px] text-muted-foreground">
            <p className="line-clamp-2">
              {icon.categories.length
                ? icon.categories.join(" · ")
                : "Brand icon"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading icon...
        </div>
      )}
    </BottomSheet>
  );
}
