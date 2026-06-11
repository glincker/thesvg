"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Copy, Download, ExternalLink } from "lucide-react";
import { BottomSheet } from "./bottom-sheet";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { loadIconsManifest } from "@/lib/icons-manifest";
import type { IconEntry } from "@/lib/icons";

/**
 * Long-press action sheet. Triggered by a >500ms hold on an icon tile
 * via the `useLongPress` hook in `mobile-shell.tsx`. Mirrors the desktop
 * right-click context menu — copy, download, open detail — without
 * navigating away from the grid.
 */
export function MobileActionSheet() {
  const router = useRouter();
  const sheet = useMobileShellStore((s) => s.sheet);
  const slug = useMobileShellStore((s) => s.actionSlug);
  const openIcon = useMobileShellStore((s) => s.openIcon);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);
  const recordCopy = useRecentsStore((s) => s.recordCopy);

  const [icon, setIcon] = useState<IconEntry | null>(null);
  const open = sheet === "action";

  useEffect(() => {
    if (!open || !slug) {
      setIcon(null);
      return;
    }
    let active = true;
    loadIconsManifest().then((icons) => {
      if (!active) return;
      setIcon(icons.find((i) => i.slug === slug) ?? null);
    });
    return () => {
      active = false;
    };
  }, [open, slug]);

  const handleCopySvg = useCallback(async () => {
    if (!icon) return;
    try {
      const res = await fetch(icon.variants.default);
      const svg = await res.text();
      await navigator.clipboard.writeText(svg);
      recordCopy(icon.slug, "svg");
      posthog.capture("icon_copied", {
        icon_slug: icon.slug,
        icon_title: icon.title,
        format: "svg",
        source: "mobile_action_sheet",
      });
      closeSheet();
    } catch {
      closeSheet();
    }
  }, [icon, recordCopy, closeSheet]);

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
    } catch {
      window.open(icon.variants.default, "_blank");
    }
    closeSheet();
  }, [icon, closeSheet]);

  const handleOpenDetail = useCallback(() => {
    if (!icon) return;
    closeSheet();
    openIcon(icon.slug);
  }, [icon, closeSheet, openIcon]);

  const handleOpenFullPage = useCallback(() => {
    if (!icon) return;
    closeSheet();
    router.push(`/icon/${icon.slug}`);
  }, [icon, closeSheet, router]);

  return (
    <BottomSheet
      open={open}
      onClose={closeSheet}
      fixedSnap="peek"
      label={icon?.title ?? "Actions"}
    >
      <div className="px-4 pb-4">
        <ul className="divide-y divide-border/40">
          <li>
            <button
              type="button"
              onClick={handleCopySvg}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                <Copy className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground">
                Copy SVG
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={handleDownload}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                <Download className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground">
                Download SVG
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={handleOpenDetail}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground">
                Open quick view
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={handleOpenFullPage}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-foreground">
                Open full page
              </span>
            </button>
          </li>
        </ul>
      </div>
    </BottomSheet>
  );
}
