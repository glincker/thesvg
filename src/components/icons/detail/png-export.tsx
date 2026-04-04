"use client";

import { useCallback, useState } from "react";
import { Download, Loader2, Image as ImageIcon } from "lucide-react";
import posthog from "posthog-js";
import { svgToPng, downloadPng } from "@/lib/svg-to-png";
import { cn } from "@/lib/utils";

interface PngExportProps {
  currentPath: string;
  svgContent: string;
  slug: string;
  activeVariant: string;
}

const PNG_SIZES = [
  { size: 32, display: 14 },
  { size: 64, display: 20 },
  { size: 128, display: 28 },
  { size: 256, display: 36 },
  { size: 512, display: 44 },
];

export function PngExport({ currentPath, svgContent, slug, activeVariant }: PngExportProps) {
  const [exportingSize, setExportingSize] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = useCallback(
    async (size: number) => {
      if (!currentPath || exportingSize !== null) return;
      setExportingSize(size);
      setExportError(null);
      try {
        const blob = await svgToPng(svgContent || currentPath, size);
        const variantSuffix =
          activeVariant !== "default"
            ? `-${activeVariant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`
            : "";
        downloadPng(blob, `${slug}${variantSuffix}-${size}px`);
        posthog.capture("icon_png_exported", {
          icon_slug: slug,
          variant: activeVariant,
          size_px: size,
        });
      } catch {
        setExportError("Could not convert this SVG to PNG. Try another variant.");
        setTimeout(() => setExportError(null), 3000);
      } finally {
        setExportingSize(null);
      }
    },
    [currentPath, svgContent, activeVariant, slug, exportingSize]
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5 text-orange-500/70" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Export PNG
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {PNG_SIZES.map(({ size, display }) => (
          <button
            key={size}
            type="button"
            disabled={exportingSize !== null}
            onClick={() => handleExport(size)}
            className={cn(
              "group/png flex flex-col items-center justify-between rounded-xl border p-2.5 shadow-sm transition-all duration-200",
              exportingSize === size
                ? "border-orange-500/40 bg-orange-500/10 shadow-md"
                : "border-border bg-card hover:border-orange-500/30 hover:bg-orange-500/5 hover:shadow-md disabled:opacity-50"
            )}
          >
            {/* Fixed-height preview area with progressive icon size */}
            <div className="icon-preview-bg flex h-14 w-full items-center justify-center rounded-lg">
              {exportingSize === size ? (
                <Loader2
                  className="animate-spin text-orange-500"
                  style={{ width: display, height: display }}
                />
              ) : (
                <img
                  src={currentPath}
                  alt={`${size}px`}
                  style={{ width: display, height: display }}
                  className="object-contain"
                />
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              <Download className="h-2.5 w-2.5 opacity-30 transition-opacity group-hover/png:opacity-100" />
              <span className="font-mono text-[10px] font-semibold text-muted-foreground tabular-nums">
                {size}px
              </span>
            </div>
          </button>
        ))}
      </div>
      {exportError && (
        <p className="mt-2 text-xs text-red-500">{exportError}</p>
      )}
    </div>
  );
}
