"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, Hash } from "lucide-react";
import posthog from "posthog-js";
import type { IconEntry } from "@/lib/icons";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { cn } from "@/lib/utils";

interface Props {
  icon: IconEntry;
  delay: number;
  cleanTitle: (t: string) => string;
}

type Flash = null | "svg" | "hex";

export function Google2026Tile({ icon, delay, cleanTitle }: Props) {
  const [flash, setFlash] = useState<Flash>(null);
  const recordCopy = useRecentsStore((s) => s.recordCopy);
  const color = `#${icon.hex || "5F6368"}`;
  const src = icon.variants.default!;

  const showFlash = useCallback((kind: Flash) => {
    setFlash(kind);
    window.setTimeout(() => setFlash(null), 1400);
  }, []);

  const copySvg = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const res = await fetch(src);
        const svg = await res.text();
        await navigator.clipboard.writeText(svg);
        showFlash("svg");
        recordCopy(icon.slug, "svg");
        posthog.capture("icon_copied", {
          icon_slug: icon.slug,
          icon_title: icon.title,
          format: "svg",
          source: "g26_tile",
        });
      } catch {
        try {
          await navigator.clipboard.writeText(`https://thesvg.org${src}`);
          showFlash("svg");
          recordCopy(icon.slug, "svg");
        } catch {
          /* clipboard blocked */
        }
      }
    },
    [src, icon.slug, icon.title, showFlash, recordCopy],
  );

  const copyHex = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(color);
        showFlash("hex");
        recordCopy(icon.slug, "hex");
        posthog.capture("icon_color_copied", {
          icon_slug: icon.slug,
          hex: color,
          source: "g26_tile",
        });
      } catch {
        /* clipboard blocked */
      }
    },
    [color, icon.slug, showFlash, recordCopy],
  );

  const downloadSvg = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const res = await fetch(src);
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
        window.open(src, "_blank");
      }
      posthog.capture("icon_downloaded", {
        icon_slug: icon.slug,
        icon_title: icon.title,
        file_type: "svg",
        source: "g26_tile",
      });
    },
    [src, icon.slug, icon.title],
  );

  return (
    <Link
      href={`/icon/${icon.slug}`}
      className={cn("g26-tile group")}
      role="listitem"
      style={
        {
          "--g26-tile-color": color,
          "--g26-tile-delay": `${delay}ms`,
        } as React.CSSProperties
      }
      aria-label={`${cleanTitle(icon.title)} SVG icon`}
    >
      <span className="g26-tile-halo" aria-hidden />

      <span className="g26-tile-card">
        { }
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="g26-tile-img"
        />

        <span className="g26-tile-actions" role="group" aria-label="Quick actions">
          <button
            type="button"
            onClick={copySvg}
            className="g26-action"
            aria-label={`Copy ${icon.title} SVG markup`}
            title="Copy SVG"
          >
            {flash === "svg" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            className="g26-action"
            aria-label={`Download ${icon.title} SVG file`}
            title="Download .svg"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </span>

        {flash && (
          <span className="g26-tile-flash" role="status">
            {flash === "svg" ? "SVG copied" : `${color} copied`}
          </span>
        )}
      </span>

      <span className="g26-tile-meta">
        <span className="g26-tile-name">{cleanTitle(icon.title)}</span>
        <button
          type="button"
          onClick={copyHex}
          className="g26-tile-swatch-btn"
          aria-label={`Copy color ${color}`}
        >
          <span
            className="g26-tile-swatch"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span className="g26-tile-tip" role="tooltip">
            {flash === "hex" ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Hash className="h-3 w-3" />
                {icon.hex?.toUpperCase()}
              </>
            )}
          </span>
        </button>
      </span>
    </Link>
  );
}
