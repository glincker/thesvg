"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Check, Copy, Download, Eye, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import type { IconEntry } from "@/lib/icons";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { cn } from "@/lib/utils";

interface IconCardProps {
  icon: IconEntry;
  onSelect: (icon: IconEntry) => void;
  compact?: boolean;
}

export const IconCard = memo(function IconCard({
  icon,
  onSelect,
  compact = false,
}: IconCardProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  // Track the slug we last prefetched, not a boolean, so virtualised/windowed
  // parents that reuse IconCard instances with different icons still prefetch
  // when the prop changes.
  const prefetchedSlug = useRef<string | null>(null);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.favorites.includes(icon.slug));

  const handleHoverPrefetch = useCallback(() => {
    if (prefetchedSlug.current === icon.slug) return;
    prefetchedSlug.current = icon.slug;
    router.prefetch(`/icon/${icon.slug}`);
  }, [router, icon.slug]);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const res = await fetch(icon.variants.default);
        const svg = await res.text();
        await navigator.clipboard.writeText(svg);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        await navigator.clipboard.writeText(
          `https://thesvg.org${icon.variants.default}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
      posthog.capture("icon_copied", {
        icon_slug: icon.slug,
        icon_title: icon.title,
        format: "svg",
        source: "card",
        categories: icon.categories,
      });
    },
    [icon.variants.default, icon.slug, icon.title, icon.categories]
  );

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
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
      } catch {
        window.open(icon.variants.default, "_blank");
      }
      posthog.capture("icon_downloaded", {
        icon_slug: icon.slug,
        icon_title: icon.title,
        variant: "default",
        file_type: "svg",
        source: "card",
        categories: icon.categories,
      });
    },
    [icon.variants.default, icon.slug, icon.title, icon.categories]
  );

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(icon.slug);
    },
    [icon.slug, toggleFavorite]
  );

  const handlePreview = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(icon);
    },
    [icon, onSelect]
  );

  const primaryCategory = icon.categories[0];

  // Theme-aware variant: show light variant on light bg, dark on dark bg
  const lightSrc = icon.variants.light || icon.variants.default;
  const darkSrc = icon.variants.dark || icon.variants.default;
  const needsThemeSwap = lightSrc !== darkSrc;

  /* ── Compact: icon-only grid ── */
  if (compact) {
    return (
      <Link
        href={`/icon/${icon.slug}`}
        prefetch={false}
        onMouseEnter={handleHoverPrefetch}
        onFocus={handleHoverPrefetch}
        onTouchStart={handleHoverPrefetch}
        className="group relative flex w-full min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-xl border border-border/40 bg-card/80 p-3 transition-all duration-200 hover:border-border hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          onClick={handleFavorite}
          role="button"
          tabIndex={-1}
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
          className={cn(
            "absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full transition-all",
            isFavorite
              ? "text-red-500 opacity-100"
              : "text-muted-foreground opacity-0 hover:text-red-500 group-hover:opacity-100"
          )}
        >
          <Heart className={cn("h-2.5 w-2.5", isFavorite && "fill-current")} />
        </div>
        <div className="icon-preview-bg flex h-10 w-10 items-center justify-center rounded-lg p-1.5">
          {needsThemeSwap ? (
            <>
              <img src={lightSrc} alt={icon.title} className="h-full w-full object-contain dark:hidden" loading="lazy" decoding="async" />
              <img src={darkSrc} alt={icon.title} className="hidden h-full w-full object-contain dark:block" loading="lazy" decoding="async" />
            </>
          ) : (
            <img src={icon.variants.default} alt={icon.title} className="h-full w-full object-contain" loading="lazy" decoding="async" />
          )}
        </div>
        <span className="w-full truncate text-center text-[10px] font-medium text-foreground">{icon.title}</span>
      </Link>
    );
  }

  /* ── Default: modern spacious card ── */
  return (
    <Link
      href={`/icon/${icon.slug}`}
      prefetch={false}
      onMouseEnter={handleHoverPrefetch}
      onFocus={handleHoverPrefetch}
      onTouchStart={handleHoverPrefetch}
      className="group relative flex h-full min-w-0 flex-col items-center rounded-xl border border-border/40 bg-card/80 transition-all duration-200 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:shadow-black/20"
    >
      {/* Favorite toggle */}
      <div
        onClick={handleFavorite}
        role="button"
        tabIndex={-1}
        aria-label={isFavorite ? `Remove ${icon.title} from favorites` : `Add ${icon.title} to favorites`}
        className={cn(
          "absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all",
          isFavorite
            ? "text-red-500 opacity-100"
            : "text-muted-foreground opacity-0 hover:text-red-500 group-hover:opacity-100"
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
      </div>

      {/* Copy toast */}
      {copied && (
        <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 animate-fade-in-up rounded-lg bg-foreground/90 px-3 py-1.5 text-xs font-medium text-background shadow-lg backdrop-blur-sm">
          Copied!
        </div>
      )}

      {/* Icon preview area */}
      <div className="icon-preview-bg flex w-full flex-1 items-center justify-center rounded-t-xl px-4 py-5 sm:px-5 sm:py-6">
        {needsThemeSwap ? (
          <>
            <img
              src={lightSrc}
              alt={icon.title}
              className="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-110 dark:hidden sm:h-10 sm:w-10"
              loading="lazy"
              decoding="async"
            />
            <img
              src={darkSrc}
              alt={icon.title}
              className="hidden h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-110 dark:block sm:h-10 sm:w-10"
              loading="lazy"
              decoding="async"
            />
          </>
        ) : (
          <img
            src={icon.variants.default}
            alt={icon.title}
            className="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>

      {/* Info section */}
      <div className="flex w-full flex-col items-center gap-0.5 px-2 pt-2 pb-1.5 sm:px-3">
        <span className="w-full truncate text-center text-[13px] font-medium text-foreground">
          {icon.title}
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          {primaryCategory || icon.slug}
        </span>
      </div>

      {/* Action bar */}
      <div className="flex w-full items-center justify-center gap-0.5 border-t border-border/20 px-1.5 py-1 sm:gap-1 sm:px-2 sm:py-1.5 dark:border-white/[0.04]">
        <div
          onClick={handleCopy}
          role="button"
          tabIndex={-1}
          aria-label="Copy SVG"
          className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="hidden text-[11px] font-medium sm:inline">Copy</span>
        </div>
        <div
          onClick={handleDownload}
          role="button"
          tabIndex={-1}
          aria-label="Download SVG"
          className="flex h-7 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Download className="h-3.5 w-3.5" />
        </div>
        <div
          onClick={handlePreview}
          role="button"
          tabIndex={-1}
          aria-label="Quick preview"
          className="flex h-7 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
});
