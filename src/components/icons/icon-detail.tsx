"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code,
  Copy,
  Download,
  FileCode2,
  Globe,
  Heart,
  Link2,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { IconEntry } from "@/lib/icons";
import type { CopyFormat } from "@/lib/copy-formats";
import { formatSvg } from "@/lib/copy-formats";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { cn } from "@/lib/utils";

interface IconDetailProps {
  icon: IconEntry | null;
  onClose: () => void;
}

const VARIANT_LABELS: Record<string, string> = {
  default: "Default",
  mono: "Mono",
  light: "Light",
  dark: "Dark",
  wordmark: "Wordmark",
  wordmarkLight: "WM Light",
  wordmarkDark: "WM Dark",
};

const FORMAT_BUTTONS: {
  value: CopyFormat;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "svg", label: "SVG", icon: <Copy className="h-3 w-3" /> },
  { value: "jsx", label: "JSX", icon: <Code className="h-3 w-3" /> },
  { value: "vue", label: "Vue", icon: <FileCode2 className="h-3 w-3" /> },
  { value: "cdn", label: "CDN", icon: <Link2 className="h-3 w-3" /> },
];

export function IconDetail({ icon, onClose }: IconDetailProps) {
  const [activeVariant, setActiveVariant] = useState("default");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) =>
    icon ? s.favorites.includes(icon.slug) : false
  );

  const variants = icon
    ? Object.entries(icon.variants).filter(
        ([, v]) => v !== undefined && v !== ""
      )
    : [];

  useEffect(() => {
    if (!icon) return;
    const variantPath =
      icon.variants[activeVariant as keyof typeof icon.variants] ||
      icon.variants.default;
    if (!variantPath) return;

    fetch(variantPath)
      .then((r) => r.text())
      .then(setSvgContent)
      .catch(() => setSvgContent(""));
  }, [icon, activeVariant]);

  const prevSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (!icon) return;
    setActiveVariant("default");
    if (icon.slug !== prevSlugRef.current) {
      prevSlugRef.current = icon.slug;
      posthog.capture("icon_viewed", {
        icon_slug: icon.slug,
        icon_title: icon.title,
        categories: icon.categories,
        variant_count: Object.values(icon.variants).filter(Boolean).length,
        source: "quick_preview",
      });
    }
  }, [icon]);

  const handleCopy = useCallback(
    async (format: CopyFormat) => {
      if (!icon || !svgContent) return;
      const text = formatSvg(svgContent, format, icon.slug, activeVariant);
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 1500);
      posthog.capture("icon_format_copied", {
        icon_slug: icon.slug,
        icon_title: icon.title,
        format,
        variant: activeVariant,
        categories: icon.categories,
        source: "quick_preview",
      });
    },
    [icon, svgContent, activeVariant]
  );

  const handleDownload = useCallback(async () => {
    if (!icon) return;
    const variantPath =
      icon.variants[activeVariant as keyof typeof icon.variants] ||
      icon.variants.default;
    if (!variantPath) return;
    try {
      const res = await fetch(variantPath);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const variantSuffix = activeVariant !== "default"
        ? `-${activeVariant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`
        : "";
      a.download = `${icon.slug}${variantSuffix}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(variantPath, "_blank");
    }
    posthog.capture("icon_svg_downloaded", {
      icon_slug: icon.slug,
      icon_title: icon.title,
      variant: activeVariant,
      categories: icon.categories,
      source: "quick_preview",
    });
  }, [icon, activeVariant]);

  const handleCopyCli = useCallback(async () => {
    if (!icon) return;
    const cmd = `npx @thesvg/cli add ${icon.slug}`;
    await navigator.clipboard.writeText(cmd);
    setCopiedFormat("cli");
    setTimeout(() => setCopiedFormat(null), 1500);
  }, [icon]);

  if (!icon) return null;

  const currentPath =
    icon.variants[activeVariant as keyof typeof icon.variants] ||
    icon.variants.default;

  return (
    <Dialog open={!!icon} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[85vh] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-border/30 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-lg">
        <DialogTitle className="sr-only">{icon.title}</DialogTitle>

        <div className="max-h-[85vh] overflow-y-auto">
          {/* Preview area */}
          <div className="icon-preview-bg relative flex items-center justify-center px-8 py-10">
            <img
              src={currentPath}
              alt={icon.title}
              className="h-24 w-24 object-contain sm:h-28 sm:w-28"
            />

            {/* Hex color */}
            {icon.hex && icon.hex !== "000000" && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-background/60 px-2 py-0.5 backdrop-blur-sm">
                <div
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-border/20"
                  style={{ backgroundColor: `#${icon.hex}` }}
                />
                <span className="font-mono text-[9px] text-muted-foreground">
                  #{icon.hex}
                </span>
              </div>
            )}

            {/* Favorite */}
            <button
              type="button"
              onClick={() => {
                toggleFavorite(icon.slug);
                posthog.capture("icon_favorited", {
                  icon_slug: icon.slug,
                  icon_title: icon.title,
                  action: isFavorite ? "removed" : "added",
                  categories: icon.categories,
                });
              }}
              className={cn(
                "absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm transition-colors",
                isFavorite
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              )}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Heart
                className={cn("h-3.5 w-3.5", isFavorite && "fill-current")}
              />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 p-4 sm:p-5">
            {/* Title + slug + categories */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{icon.title}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{icon.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label="Download SVG"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
              {icon.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {icon.categories.slice(0, 3).map((cat) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="rounded-md px-2 py-0.5 text-[10px]"
                    >
                      {cat}
                    </Badge>
                  ))}
                  {icon.categories.length > 3 && (
                    <span className="self-center text-[10px] text-muted-foreground">
                      +{icon.categories.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Variant pills */}
            {variants.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {variants.map(([key]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveVariant(key);
                      if (key !== activeVariant) {
                        posthog.capture("icon_variant_switched", {
                          icon_slug: icon.slug,
                          icon_title: icon.title,
                          from_variant: activeVariant,
                          to_variant: key,
                        });
                      }
                    }}
                    className={cn(
                      "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                      activeVariant === key
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {VARIANT_LABELS[key] || key}
                  </button>
                ))}
              </div>
            )}

            {/* Copy format buttons */}
            <div className="flex flex-wrap gap-1.5">
              {FORMAT_BUTTONS.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-all duration-150",
                    copiedFormat === fmt.value
                      ? "scale-[1.02] border-green-500/30 bg-green-500/10 text-green-600 shadow-sm dark:text-green-400"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => handleCopy(fmt.value)}
                >
                  {copiedFormat === fmt.value ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    fmt.icon
                  )}
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* CLI quick command */}
            <button
              type="button"
              onClick={handleCopyCli}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-150",
                copiedFormat === "cli"
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <Terminal className="h-3 w-3 shrink-0 text-orange-500/70" />
              <code className="flex-1 truncate text-left font-mono text-[11px] text-muted-foreground">
                npx @thesvg/cli add {icon.slug}
              </code>
              {copiedFormat === "cli" ? (
                <Check className="h-3 w-3 shrink-0 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              )}
            </button>

            {/* Links row */}
            {(icon.url || icon.guidelines) && (
              <div className="flex flex-wrap gap-1.5">
                {icon.url && (
                  <a
                    href={icon.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(icon.url).hostname}&sz=32`}
                      alt=""
                      width={12}
                      height={12}
                      className="h-3 w-3 rounded-sm"
                    />
                    <span className="max-w-[100px] truncate">
                      {new URL(icon.url).hostname.replace(/^www\./, "")}
                    </span>
                    <ArrowUpRight className="h-2.5 w-2.5 opacity-40" />
                  </a>
                )}
                {icon.guidelines && (
                  <a
                    href={icon.guidelines}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Globe className="h-3 w-3 opacity-60" />
                    Guidelines
                    <ArrowUpRight className="h-2.5 w-2.5 opacity-40" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer: Full page CTA */}
          <div className="border-t border-border/30 p-3 sm:p-4">
            <Link
              href={`/icon/${icon.slug}`}
              onClick={onClose}
              className="group/cta flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.99]"
            >
              View full details
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
