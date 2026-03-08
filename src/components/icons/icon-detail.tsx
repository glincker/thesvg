"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Image,
  Link2,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { IconEntry } from "@/lib/icons";
import type { CopyFormat } from "@/lib/copy-formats";
import { formatSvg } from "@/lib/copy-formats";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { cn } from "@/lib/utils";
import { svgToPng, downloadPng } from "@/lib/svg-to-png";

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
  { value: "svg", label: "SVG", icon: <Copy className="h-3.5 w-3.5" /> },
  { value: "jsx", label: "JSX", icon: <Code className="h-3.5 w-3.5" /> },
  {
    value: "vue",
    label: "Vue",
    icon: <FileCode2 className="h-3.5 w-3.5" />,
  },
  {
    value: "cdn",
    label: "CDN",
    icon: <Link2 className="h-3.5 w-3.5" />,
  },
  {
    value: "data-uri",
    label: "URI",
    icon: <Globe className="h-3.5 w-3.5" />,
  },
];

const DEMO_SIZES = [16, 24, 32, 48, 64];
const PNG_EXPORT_SIZES = [32, 64, 128, 256, 512];

/** Naive pretty-print: add line breaks between tags so SVG code is readable */
function formatSvgCode(raw: string): string {
  return raw
    .replace(/>\s*</g, ">\n<")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function IconDetail({ icon, onClose }: IconDetailProps) {
  const [activeVariant, setActiveVariant] = useState("default");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [exportingSize, setExportingSize] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) =>
    icon ? s.favorites.includes(icon.slug) : false
  );

  const variants = icon
    ? Object.entries(icon.variants).filter(
        ([, v]) => v !== undefined && v !== ""
      )
    : [];

  const formattedCode = useMemo(
    () => (svgContent ? formatSvgCode(svgContent) : ""),
    [svgContent]
  );

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

  useEffect(() => {
    setActiveVariant("default");
    setShowCode(false);
  }, [icon?.slug]);

  const handleCopy = useCallback(
    async (format: CopyFormat) => {
      if (!icon || !svgContent) return;
      const variantKey =
        activeVariant === "default" ? "default" : activeVariant;
      const text = formatSvg(svgContent, format, icon.slug, variantKey);
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 1500);
    },
    [icon, svgContent, activeVariant]
  );

  const handleCopyRaw = useCallback(async () => {
    if (!svgContent) return;
    await navigator.clipboard.writeText(svgContent);
    setCopiedFormat("raw");
    setTimeout(() => setCopiedFormat(null), 1500);
  }, [svgContent]);

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
  }, [icon, activeVariant]);

  const handlePngExport = useCallback(
    async (size: number) => {
      if (!icon || exportingSize !== null) return;
      const variantPath =
        icon.variants[activeVariant as keyof typeof icon.variants] ||
        icon.variants.default;
      if (!variantPath) return;

      setExportingSize(size);
      setExportError(null);
      try {
        const blob = await svgToPng(variantPath, size);
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
    [icon, activeVariant, exportingSize]
  );

  if (!icon) return null;

  const currentPath =
    icon.variants[activeVariant as keyof typeof icon.variants] ||
    icon.variants.default;

  return (
    <Dialog open={!!icon} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-border/30 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-2xl">
        <DialogTitle className="sr-only">{icon.title}</DialogTitle>

        <div className="max-h-[90vh] overflow-y-auto">
        {/* Top section: preview + info side by side on desktop */}
        <div className="flex flex-col md:flex-row">
          {/* Preview area */}
          <div className="icon-preview-bg relative flex shrink-0 items-center justify-center p-8 md:w-56">
            <img
              src={currentPath}
              alt={icon.title}
              className="h-28 w-28 object-contain"
            />

            {/* Hex color */}
            {icon.hex && icon.hex !== "000000" && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 backdrop-blur-sm">
                <div
                  className="h-2.5 w-2.5 rounded-full"
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
              onClick={() => toggleFavorite(icon.slug)}
              className={cn(
                "absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm transition-colors",
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

          {/* Info + actions */}
          <div className="flex-1 space-y-3 p-4 pr-12">
            {/* Title + slug */}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{icon.title}</h2>
              <p className="font-mono text-xs text-muted-foreground">
                {icon.slug}
              </p>
            </div>

            {/* Categories */}
            {icon.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {icon.categories.slice(0, 4).map((cat) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="rounded-md px-2 py-0.5 text-[10px]"
                  >
                    {cat}
                  </Badge>
                ))}
                {icon.categories.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{icon.categories.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Variant pills */}
            {variants.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {variants.map(([key]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveVariant(key)}
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
                    "flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium transition-colors sm:h-8 sm:px-3",
                    copiedFormat === fmt.value
                      ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
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
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:h-8 sm:w-8"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Links */}
            {(icon.url || icon.guidelines) && (
              <div className="flex gap-3 text-[11px]">
                {icon.url && (
                  <a
                    href={icon.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </a>
                )}
                {icon.guidelines && (
                  <a
                    href={icon.guidelines}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Guidelines
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Size demo section */}
        <div className="border-t border-border/30 px-4 py-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Size Preview
          </p>
          <div className="flex flex-wrap items-end gap-2 sm:gap-4">
            {DEMO_SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <div className="icon-preview-bg flex items-center justify-center rounded-md p-1">
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

        {/* Export PNG section */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Image className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Export PNG
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PNG_EXPORT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                disabled={exportingSize !== null}
                onClick={() => handlePngExport(size)}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-md border px-2.5 text-[11px] font-medium transition-colors",
                  exportingSize === size
                    ? "border-border/50 bg-muted/60 text-muted-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                )}
              >
                {exportingSize === size ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                {size}px
              </button>
            ))}
          </div>
          {exportError && (
            <p className="mt-1.5 text-[10px] text-red-500">{exportError}</p>
          )}
        </div>

        {/* SVG code preview */}
        <div className="border-t border-border/30">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowCode(!showCode)}
            onKeyDown={(e) => e.key === "Enter" && setShowCode(!showCode)}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              SVG Code
            </span>
            {showCode ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          {showCode && formattedCode && (
            <div className="relative min-w-0 px-4 pb-4">
              {/* Copy button floating top-right of code block */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleCopyRaw}
                onKeyDown={(e) => e.key === "Enter" && handleCopyRaw()}
                className={cn(
                  "absolute top-2 right-6 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
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
              </div>
              <div className="overflow-hidden rounded-lg border border-border/40 bg-muted/40">
                <pre className="max-h-48 overflow-x-auto overflow-y-auto p-3 pr-16 font-mono text-[10px] leading-5 text-foreground/80">
                  <code className="block whitespace-pre">{formattedCode}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
