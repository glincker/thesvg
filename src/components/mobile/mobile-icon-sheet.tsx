"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BottomSheetSnap } from "./bottom-sheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { ArrowUpRight, Check, Copy, Download, Globe, Heart, Layers, Scale, Sparkles } from "lucide-react";
import { BottomSheet } from "./bottom-sheet";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";
import { useMobilePrefsStore } from "@/lib/stores/mobile-prefs-store";
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
  const iconOpenMode = useMobilePrefsStore((s) => s.iconOpenMode);
  const setIconOpenMode = useMobilePrefsStore((s) => s.setIconOpenMode);

  const [icon, setIcon] = useState<IconEntry | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [iconSheetSnap, setIconSheetSnap] = useState<BottomSheetSnap>("half");
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

  const variantKeys = icon
    ? Object.keys(icon.variants).filter((k) => Boolean(icon.variants[k]))
    : [];

  return (
    <BottomSheet
      open={open}
      onClose={closeSheet}
      snap={iconSheetSnap}
      onSnapChange={setIconSheetSnap}
      label={icon?.title ?? "Icon"}
    >
      {icon ? (
        <div className="flex h-full flex-col">
          {/* Preview with favorite + hex chip */}
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
            <span
              className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-1 font-mono text-[10px] font-semibold text-foreground backdrop-blur-md"
              title="Brand color"
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10"
                style={{ background: `#${icon.hex}` }}
              />
              #{icon.hex.toUpperCase()}
            </span>
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
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </button>
          </div>

          {/* Categories under preview, scrollable */}
          {icon.categories.length > 0 && (
            <div className="-mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 scrollbar-none">
              {icon.categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}`}
                  onClick={() => closeSheet()}
                  className="shrink-0 rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground dark:bg-white/[0.04]"
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}

          {/* Copy format chips */}
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

          {/* Primary actions */}
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

          {/* Detail meta grid */}
          <dl className="mx-4 mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-border/40 bg-card/40 p-3 text-[11px] dark:border-white/[0.06] dark:bg-white/[0.02]">
            <MetaCell
              icon={<Scale className="h-3 w-3" />}
              label="License"
              value={icon.license || "Unknown"}
            />
            <MetaCell
              icon={<Layers className="h-3 w-3" />}
              label="Variants"
              value={`${variantKeys.length}`}
              hint={variantKeys.slice(0, 4).join(", ")}
            />
            <MetaCell
              icon={<Sparkles className="h-3 w-3" />}
              label="Collection"
              value={icon.collection}
            />
            <MetaCell
              icon={<Globe className="h-3 w-3" />}
              label="Slug"
              value={icon.slug}
              mono
            />
          </dl>

          {icon.url && (
            <a
              href={icon.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-4 mt-2 flex items-center justify-between rounded-xl border border-border/40 px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground dark:border-white/[0.06]"
            >
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                <span className="truncate">{prettyUrl(icon.url)}</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          )}

          {/* Eye-catching full details CTA */}
          <div className="mx-4 mt-3">
            <Link
              href={`/icon/${icon.slug}`}
              onClick={() => closeSheet()}
              className="group/details relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-orange-500/50 hover:shadow-[0_8px_24px_-8px_rgba(249,115,22,0.45)] active:translate-y-0"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/details:translate-x-full dark:via-white/15"
              />
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-[0_4px_10px_-2px_rgba(249,115,22,0.55)]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    Open full details
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    PNG export, every variant, raw SVG, install snippets
                  </span>
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-orange-600 transition-transform group-hover/details:translate-x-0.5 group-hover/details:-translate-y-0.5 dark:text-orange-400" />
            </Link>
          </div>

          {/* Open-mode preference toggle */}
          <div className="mx-4 mt-3 mb-4 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-[11px] dark:bg-white/[0.02]">
            <span className="flex flex-col">
              <span className="font-medium text-foreground">
                Skip preview next time
              </span>
              <span className="text-muted-foreground">
                Jump straight to the detail page
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={iconOpenMode === "page"}
              onClick={() =>
                setIconOpenMode(iconOpenMode === "page" ? "sheet" : "page")
              }
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                iconOpenMode === "page" ? "bg-orange-500" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-background shadow-sm transition-transform",
                  iconOpenMode === "page" ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
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

function MetaCell({
  icon,
  label,
  value,
  hint,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-muted-foreground/80">
        {icon}
        <span className="uppercase tracking-wider">{label}</span>
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-[12px] font-medium text-foreground",
          mono && "font-mono text-[11px]",
        )}
        title={hint || value}
      >
        {value}
      </dd>
    </div>
  );
}

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return url;
  }
}
