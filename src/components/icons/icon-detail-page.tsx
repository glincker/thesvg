"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Globe,
  Heart,
  Home,
  Image,
  Link2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IconEntry } from "@/lib/icons";
import type { CopyFormat } from "@/lib/copy-formats";
import { formatSvg } from "@/lib/copy-formats";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { cn } from "@/lib/utils";
import { svgToPng, downloadPng } from "@/lib/svg-to-png";

interface IconDetailPageProps {
  icon: IconEntry;
  relatedIcons?: IconEntry[];
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
  { value: "svg", label: "SVG", icon: <Copy className="h-3.5 w-3.5" /> },
  { value: "jsx", label: "JSX", icon: <Code className="h-3.5 w-3.5" /> },
  { value: "vue", label: "Vue", icon: <FileCode2 className="h-3.5 w-3.5" /> },
  { value: "cdn", label: "CDN", icon: <Link2 className="h-3.5 w-3.5" /> },
  { value: "data-uri", label: "URI", icon: <Globe className="h-3.5 w-3.5" /> },
];

const DEMO_SIZES = [16, 24, 32, 48, 64];
const PNG_EXPORT_SIZES = [32, 64, 128, 256, 512];

function formatSvgCode(raw: string): string {
  return raw
    .replace(/>\s*</g, ">\n<")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function IconDetailPage({ icon, relatedIcons = [] }: IconDetailPageProps) {
  const [activeVariant, setActiveVariant] = useState("default");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [exportingSize, setExportingSize] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) =>
    s.favorites.includes(icon.slug)
  );

  const variants = Object.entries(icon.variants).filter(
    ([, v]) => v !== undefined && v !== ""
  );

  const formattedCode = useMemo(
    () => (svgContent ? formatSvgCode(svgContent) : ""),
    [svgContent]
  );

  const currentPath =
    icon.variants[activeVariant as keyof typeof icon.variants] ||
    icon.variants.default;

  useEffect(() => {
    if (!currentPath) return;
    fetch(currentPath)
      .then((r) => r.text())
      .then(setSvgContent)
      .catch(() => setSvgContent(""));
  }, [currentPath]);

  const handleCopy = useCallback(
    async (format: CopyFormat) => {
      if (!svgContent) return;
      const text = formatSvg(svgContent, format, icon.slug, activeVariant);
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 1500);
    },
    [svgContent, icon.slug, activeVariant]
  );

  const handleCopyRaw = useCallback(async () => {
    if (!svgContent) return;
    await navigator.clipboard.writeText(svgContent);
    setCopiedFormat("raw");
    setTimeout(() => setCopiedFormat(null), 1500);
  }, [svgContent]);

  const handleDownload = useCallback(async () => {
    if (!currentPath) return;
    try {
      const res = await fetch(currentPath);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const variantSuffix =
        activeVariant !== "default"
          ? `-${activeVariant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`
          : "";
      a.download = `${icon.slug}${variantSuffix}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(currentPath, "_blank");
    }
  }, [currentPath, icon.slug, activeVariant]);

  const handlePngExport = useCallback(
    async (size: number) => {
      if (!currentPath || exportingSize !== null) return;
      setExportingSize(size);
      setExportError(null);
      try {
        const blob = await svgToPng(currentPath, size);
        const variantSuffix =
          activeVariant !== "default"
            ? `-${activeVariant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`
            : "";
        downloadPng(blob, `${icon.slug}${variantSuffix}-${size}px`);
      } catch {
        setExportError("Could not convert this SVG to PNG. Try another variant.");
        setTimeout(() => setExportError(null), 3000);
      } finally {
        setExportingSize(null);
      }
    },
    [currentPath, activeVariant, icon.slug, exportingSize]
  );

  const primaryCategory = icon.categories[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link
          href="/"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <Home className="h-3 w-3" />
          Home
        </Link>
        {primaryCategory && (
          <>
            <span>/</span>
            <Link
              href={`/?category=${encodeURIComponent(primaryCategory)}`}
              className="transition-colors hover:text-foreground"
            >
              {primaryCategory}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="min-w-0 truncate text-foreground">{icon.title}</span>
      </nav>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* Left column: large preview */}
        <div className="flex flex-col gap-4">
          {/* Preview card */}
          <div className="icon-preview-bg relative flex items-center justify-center rounded-2xl p-16">
            <img
              src={currentPath}
              alt={icon.title}
              className="h-40 w-40 object-contain"
            />

            {/* Hex badge */}
            {icon.hex && icon.hex !== "000000" && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-border/40 bg-background/70 px-2.5 py-1 backdrop-blur-sm">
                <div
                  className="h-3 w-3 rounded-full ring-1 ring-border/30"
                  style={{ backgroundColor: `#${icon.hex}` }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">
                  #{icon.hex}
                </span>
              </div>
            )}

            {/* Favorite toggle */}
            <button
              type="button"
              onClick={() => toggleFavorite(icon.slug)}
              className={cn(
                "absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-background/70 backdrop-blur-sm transition-colors",
                isFavorite
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn("h-4 w-4", isFavorite && "fill-current")}
              />
            </button>
          </div>

          {/* Size preview */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Size Preview
            </p>
            <div className="flex flex-wrap items-end gap-2 sm:gap-4">
              {DEMO_SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-1.5">
                  <div className="icon-preview-bg flex items-center justify-center rounded-lg p-1.5">
                    <img
                      src={currentPath}
                      alt={`${icon.title} at ${size}px`}
                      style={{ width: size, height: size }}
                      className="object-contain"
                    />
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {size}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: info + actions */}
        <div className="flex flex-col gap-6">
          {/* Title + slug + download */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">{icon.title}</h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {icon.slug}
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              className="shrink-0"
              onClick={handleDownload}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </Button>
          </div>

          {/* Categories */}
          {icon.categories.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {icon.categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/?category=${encodeURIComponent(cat)}`}
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {cat}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Aliases */}
          {icon.aliases.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Also known as
              </p>
              <p className="text-sm text-muted-foreground">
                {icon.aliases.join(", ")}
              </p>
            </div>
          )}

          {/* Variant switcher */}
          {variants.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Variants
              </p>
              <div className="scrollbar-none flex flex-wrap gap-1.5">
                {variants.map(([key]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveVariant(key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      activeVariant === key
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {VARIANT_LABELS[key] || key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Copy format buttons */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Copy as
            </p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_BUTTONS.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors",
                    copiedFormat === fmt.value
                      ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => handleCopy(fmt.value)}
                >
                  {copiedFormat === fmt.value ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    fmt.icon
                  )}
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Export PNG */}
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Export PNG
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PNG_EXPORT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  disabled={exportingSize !== null}
                  onClick={() => handlePngExport(size)}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                    exportingSize === size
                      ? "border-border/50 bg-muted/60 text-muted-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  )}
                >
                  {exportingSize === size ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Image className="h-3.5 w-3.5" />
                  )}
                  {size}px
                </button>
              ))}
            </div>
            {exportError && (
              <p className="mt-2 text-xs text-red-500">{exportError}</p>
            )}
          </div>

          {/* SVG code viewer (collapsible) */}
          <div className="overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                SVG Code
              </span>
              {showCode ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            {showCode && formattedCode && (
              <div className="relative border-t border-border">
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className={cn(
                    "absolute top-2 right-3 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                    copiedFormat === "raw"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-background/80 text-muted-foreground backdrop-blur-sm hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {copiedFormat === "raw" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedFormat === "raw" ? "Copied" : "Copy"}
                </button>
                <pre className="max-h-64 overflow-auto bg-muted/30 p-4 pr-16 font-mono text-[11px] leading-5 text-foreground/80">
                  <code className="block whitespace-pre">{formattedCode}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Links + license */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm">
            {icon.url && (
              <a
                href={icon.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            )}
            {icon.guidelines && (
              <a
                href={icon.guidelines}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Brand Guidelines
              </a>
            )}
            <span className="text-muted-foreground">
              License:{" "}
              <span className="font-medium text-foreground">{icon.license}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Related icons */}
      {relatedIcons.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">
            Related in{" "}
            <span className="text-muted-foreground">{primaryCategory}</span>
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {relatedIcons.map((rel) => (
              <Link
                key={rel.slug}
                href={`/icon/${rel.slug}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-border/80 hover:bg-accent"
              >
                <div className="icon-preview-bg flex h-12 w-12 items-center justify-center rounded-lg p-2">
                  <img
                    src={rel.variants.default}
                    alt={rel.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="line-clamp-1 w-full text-center text-[10px] text-muted-foreground transition-colors group-hover:text-foreground">
                  {rel.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
