"use client";

import { useCallback, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Clipboard,
  Download,
  FileCode,
  ImageIcon,
  Loader2,
} from "lucide-react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  downloadBlob,
  fetchSvgText,
  type RasterFormat,
  svgToRaster,
} from "@/lib/svg-to-png";

interface DownloadMenuProps {
  svgContent: string;
  currentPath: string;
  slug: string;
  title: string;
  activeVariant: string;
}

const RASTER_SIZES = [32, 64, 128, 256, 512, 1024] as const;
const RASTER_FORMATS: { id: RasterFormat; label: string; ext: string }[] = [
  { id: "png", label: "PNG", ext: "png" },
  { id: "jpeg", label: "JPG", ext: "jpg" },
  { id: "webp", label: "WebP", ext: "webp" },
];

function safeName(slug: string, variant: string): string {
  const variantSuffix =
    variant !== "default"
      ? `-${variant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`
      : "";
  return `${slug}${variantSuffix}`;
}

export function DownloadMenu({
  svgContent,
  currentPath,
  slug,
  title,
  activeVariant,
}: DownloadMenuProps) {
  // Tracked per action so one in-flight (or stalled) export never disables the
  // other half of the split button or any unrelated menu item. Combined with
  // the timeout in svgToRaster, a failed export always clears its own key.
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<RasterFormat>("png");

  const startBusy = useCallback((key: string) => {
    setError(null);
    setBusy((prev) => new Set(prev).add(key));
  }, []);
  const endBusy = useCallback((key: string) => {
    setBusy((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  // Concurrent actions share these two feedback slots, so each flash cancels
  // and replaces its own prior timer instead of two actions' timers racing to
  // clear a confirmation or error that belongs to the other.
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashDone = useCallback(() => {
    setDone(true);
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    doneTimerRef.current = setTimeout(() => setDone(false), 1600);
  }, []);

  const flashError = useCallback((message: string) => {
    setError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
  }, []);

  const handleSvgDownload = useCallback(async () => {
    if (busy.has("svg")) return;
    startBusy("svg");
    try {
      const text = svgContent ? svgContent : await fetchSvgText(currentPath);
      const blob = new Blob([text], { type: "image/svg+xml" });
      downloadBlob(blob, `${safeName(slug, activeVariant)}.svg`);
      posthog.capture("icon_downloaded", {
        icon_slug: slug,
        variant: activeVariant,
        file_type: "svg",
        source: "download_menu",
      });
      flashDone();
    } catch {
      window.open(currentPath, "_blank", "noopener");
    } finally {
      endBusy("svg");
    }
  }, [busy, svgContent, currentPath, slug, activeVariant, flashDone, startBusy, endBusy]);

  const handleRasterDownload = useCallback(
    async (format: RasterFormat, size: number) => {
      const key = `${format}-${size}`;
      if (busy.has(key)) return;
      startBusy(key);
      try {
        const source = svgContent || currentPath;
        const blob = await svgToRaster(source, size, format);
        const fmt = RASTER_FORMATS.find((f) => f.id === format);
        downloadBlob(
          blob,
          `${safeName(slug, activeVariant)}-${size}px.${fmt?.ext ?? format}`,
        );
        posthog.capture("icon_raster_exported", {
          icon_slug: slug,
          variant: activeVariant,
          format,
          size_px: size,
          source: "download_menu",
        });
        flashDone();
      } catch {
        flashError(`${format.toUpperCase()} export failed. Please try again.`);
      } finally {
        endBusy(key);
      }
    },
    [busy, svgContent, currentPath, slug, activeVariant, flashDone, flashError, startBusy, endBusy],
  );

  const handleCopyDataUri = useCallback(async () => {
    if (busy.has("uri")) return;
    startBusy("uri");
    try {
      const text = svgContent ? svgContent : await fetchSvgText(currentPath);
      const uri = `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
      await navigator.clipboard.writeText(uri);
      flashDone();
    } catch {
      flashError("Copy failed. Please try again.");
    } finally {
      endBusy("uri");
    }
  }, [busy, svgContent, currentPath, flashDone, flashError, startBusy, endBusy]);

  return (
    <div className="inline-flex items-stretch">
      <Button
        type="button"
        size="sm"
        onClick={handleSvgDownload}
        disabled={busy.has("svg")}
        aria-label={`Download ${title} SVG`}
        className={cn(
          "h-9 rounded-r-none border-r border-background/20 px-3 transition-all duration-300",
          done && "bg-emerald-600 hover:bg-emerald-600",
        )}
      >
        {done ? (
          <Check className="mr-1.5 h-4 w-4" />
        ) : busy.has("svg") ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-4 w-4" />
        )}
        {done ? "Done" : "Download"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="sm"
              aria-label="More download formats"
              className="h-9 rounded-l-none px-2"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-[280px] p-0"
        >
          {/* Header */}
          <div className="border-b border-border/40 px-3 py-2">
            <p className="flex items-center justify-between text-[11px] font-semibold text-foreground">
              Export {title}
              <span className="rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground dark:bg-white/[0.06]">
                {activeVariant}
              </span>
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="border-b border-border/40 px-3 py-2 text-[11px] font-medium text-red-500"
            >
              {error}
            </p>
          )}

          {/* Vector section */}
          <div className="border-b border-border/40 p-2">
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <FileCode className="h-3 w-3" />
              Vector
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleSvgDownload}
                disabled={busy.has("svg")}
                className={cn(
                  "group flex flex-col items-start gap-1 rounded-lg border border-border/40 bg-card/30 px-2.5 py-2 text-left transition-all hover:border-border hover:bg-card hover:shadow-sm disabled:opacity-50",
                  busy.has("svg") && "border-border bg-card",
                )}
              >
                <span className="flex items-center gap-1.5">
                  {busy.has("svg") ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
                  )}
                  <span className="text-xs font-semibold text-foreground">
                    SVG
                  </span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  download
                </span>
              </button>
              <button
                type="button"
                onClick={handleCopyDataUri}
                disabled={busy.has("uri")}
                className={cn(
                  "group flex flex-col items-start gap-1 rounded-lg border border-border/40 bg-card/30 px-2.5 py-2 text-left transition-all hover:border-border hover:bg-card hover:shadow-sm disabled:opacity-50",
                  busy.has("uri") && "border-border bg-card",
                )}
              >
                <span className="flex items-center gap-1.5">
                  {busy.has("uri") ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Clipboard className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
                  )}
                  <span className="text-xs font-semibold text-foreground">
                    Data URI
                  </span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  copy
                </span>
              </button>
            </div>
          </div>

          {/* Raster section */}
          <div className="p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                <ImageIcon className="h-3 w-3" />
                Raster
              </p>
              <div className="flex items-center gap-0.5 rounded-md border border-border/40 bg-muted/40 p-0.5 dark:bg-white/[0.03]">
                {RASTER_FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setActiveFormat(fmt.id)}
                    aria-pressed={activeFormat === fmt.id}
                    className={cn(
                      "rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase transition-colors",
                      activeFormat === fmt.id
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {RASTER_SIZES.map((size) => {
                const key = `${activeFormat}-${size}`;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleRasterDownload(activeFormat, size)}
                    disabled={busy.has(key)}
                    className={cn(
                      "group flex flex-col items-center justify-center gap-0.5 rounded-md border border-border/40 bg-card/30 py-1.5 transition-all hover:border-border hover:bg-card hover:shadow-sm disabled:opacity-50",
                      busy.has(key) && "border-border bg-card",
                    )}
                  >
                    {busy.has(key) ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-foreground">
                          {size}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground/70">
                          px
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
