"use client";

import { useMemo, useState } from "react";
import {
  Checkerboard,
  GridFour,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Moon,
  Sun,
} from "@phosphor-icons/react/dist/ssr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IconInspectorModalProps {
  title: string;
  src: string;
}

type Background = "checker" | "light" | "dark";

const ZOOM_LEVELS = [64, 128, 256, 384, 512];

const CHECKER_STYLE = {
  backgroundColor: "#f4f4f5",
  backgroundImage:
    "linear-gradient(45deg, #d4d4d8 25%, transparent 25%), linear-gradient(-45deg, #d4d4d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d8 75%), linear-gradient(-45deg, transparent 75%, #d4d4d8 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
} as const;

/**
 * Icon design grid: the standard keyline overlay used by system-icon specs
 * (Material Design's 24dp grid) to check optical balance rather than pixel
 * alignment - a live-area circle, a keyline square, and the two keyline
 * rectangles, all centered on the same 24-unit canvas as the trim area.
 */
function IconDesignGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="12" y1="0" x2="12" y2="24"
        stroke="currentColor" strokeOpacity="0.15" strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="0" y1="12" x2="24" y2="12"
        stroke="currentColor" strokeOpacity="0.15" strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="12" cy="12" r="10"
        fill="none" stroke="#3b82f6" strokeOpacity="0.6"
        strokeDasharray="2 1.5" strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x="3" y="3" width="18" height="18"
        fill="none" stroke="#f97316" strokeOpacity="0.6"
        strokeDasharray="2 1.5" strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x="2" y="4" width="20" height="16"
        fill="none" stroke="#22c55e" strokeOpacity="0.5"
        strokeDasharray="2 1.5" strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x="4" y="2" width="16" height="20"
        fill="none" stroke="#22c55e" strokeOpacity="0.5"
        strokeDasharray="2 1.5" strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function IconInspectorModal({ title, src }: IconInspectorModalProps) {
  const [zoomStep, setZoomStep] = useState(2);
  const [background, setBackground] = useState<Background>("checker");
  const [showGrid, setShowGrid] = useState(false);

  const zoom = ZOOM_LEVELS[zoomStep];
  const canvasStyle = useMemo(() => {
    if (background === "checker") return CHECKER_STYLE;
    return undefined;
  }, [background]);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 shadow-sm ring-1 ring-orange-500/20 backdrop-blur-sm transition-all hover:scale-105 hover:bg-orange-500/20"
            aria-label={`Inspect ${title} zoomed in`}
          />
        }
      >
        <MagnifyingGlassPlus className="h-4 w-4" weight="bold" />
      </DialogTrigger>

      <DialogContent className="flex max-h-[85vh] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{title} - pixel inspector</DialogTitle>
            <Badge
              variant="outline"
              className="h-4 border-orange-500/40 bg-orange-500/10 px-1.5 text-[10px] text-orange-500"
            >
              Beta
            </Badge>
          </div>
          <DialogDescription>
            Zoom in to check edges and curves against the standard icon
            design grid. This is the vector artwork scaled up, not a raster
            crop, so it stays crisp at every size.
          </DialogDescription>
        </DialogHeader>

        {/* Viewer canvas - scrolls/pans when the selected zoom is larger than
            the visible area, rather than silently shrinking the artwork and
            mislabeling its actual rendered size. */}
        <div
          className={cn(
            "relative flex h-[360px] items-center justify-center overflow-auto rounded-xl border border-border/60 sm:h-[420px]",
            background === "dark" && "bg-zinc-900",
            background === "light" && "bg-white"
          )}
          style={canvasStyle}
        >
          <div
            className="relative m-auto shrink-0"
            style={{ width: zoom, height: zoom }}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-contain drop-shadow-md"
            />
            {showGrid && (
              <IconDesignGrid
                className={cn(
                  "pointer-events-none absolute inset-0 h-full w-full",
                  background === "dark" ? "text-white" : "text-zinc-900"
                )}
              />
            )}
          </div>
          <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
            {zoom}px
          </span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Background toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
            {(
              [
                { value: "checker" as const, icon: Checkerboard, label: "Transparent" },
                { value: "light" as const, icon: Sun, label: "Light" },
                { value: "dark" as const, icon: Moon, label: "Dark" },
              ]
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setBackground(value)}
                aria-pressed={background === value}
                aria-label={`${label} background`}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                  background === value
                    ? "bg-orange-500/15 text-orange-500"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Grid overlay toggle */}
            <button
              type="button"
              onClick={() => setShowGrid((prev) => !prev)}
              aria-pressed={showGrid}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs font-medium transition-colors",
                showGrid
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GridFour className="h-3.5 w-3.5" />
              Grid
            </button>

            {/* Zoom stepper */}
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setZoomStep((prev) => Math.max(prev - 1, 0))}
                disabled={zoomStep === 0}
                aria-label="Zoom out"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <MagnifyingGlassMinus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-mono text-xs text-muted-foreground">
                {zoom}px
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomStep((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1))
                }
                disabled={zoomStep === ZOOM_LEVELS.length - 1}
                aria-label="Zoom in"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <MagnifyingGlassPlus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
