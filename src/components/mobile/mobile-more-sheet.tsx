"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  Heart,
  Layers,
} from "lucide-react";
import { BottomSheet, type BottomSheetSnap } from "./bottom-sheet";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";

interface InternalItem {
  href: string;
  label: string;
  description: string;
  Icon: typeof Layers;
}

interface ExternalItem {
  href: string;
  label: string;
  description: string;
  /** Path to a brand SVG inside the catalog itself. Dog-fooded — we
   *  serve the same files we ship to consumers. */
  iconSrc: string;
}

const APP_LINKS: ReadonlyArray<InternalItem> = [
  {
    href: "/extensions",
    label: "Extensions",
    description: "VS Code, Raycast, Figma, npm package",
    Icon: Layers,
  },
  {
    href: "/blog",
    label: "Blog",
    description: "Updates and changelog",
    Icon: FileText,
  },
  {
    href: "/recents",
    label: "Recents",
    description: "Recently viewed and copied",
    Icon: BookOpen,
  },
  {
    href: "/?favorites=true",
    label: "Favorites",
    description: "Icons you have starred",
    Icon: Heart,
  },
];

const EXTERNAL_LINKS: ReadonlyArray<ExternalItem> = [
  {
    href: "https://github.com/GLINCKER/thesvg",
    label: "GitHub",
    description: "Source and issues",
    iconSrc: "/icons/github/default.svg",
  },
  {
    href: "https://www.npmjs.com/package/thesvg",
    label: "npm package",
    description: "thesvg on npm",
    iconSrc: "/icons/npm/default.svg",
  },
  {
    href: "https://www.raycast.com/thegdsks/thesvg",
    label: "Raycast extension",
    description: "Search icons from Raycast",
    iconSrc: "/icons/raycast/default.svg",
  },
  {
    href: "https://www.figma.com/community/plugin/1612997159050367763",
    label: "Figma plugin",
    description: "Drop icons into your Figma file",
    iconSrc: "/icons/figma/default.svg",
  },
  {
    href: "https://marketplace.visualstudio.com/items?itemName=glincker.thesvg",
    label: "VS Code extension",
    description: "Search and copy from VS Code",
    iconSrc: "/icons/visual-studio-code/default.svg",
  },
];

export function MobileMoreSheet() {
  const sheet = useMobileShellStore((s) => s.sheet);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);
  const open = sheet === "more";
  // Local snap state so the handle can drag the sheet between half and
  // full and a downward flick dismisses cleanly — feels like a native
  // iOS sheet instead of a fixed-height popover.
  const [snap, setSnap] = useState<BottomSheetSnap>("half");

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setSnap("half");
        closeSheet();
      }}
      snap={snap}
      onSnapChange={setSnap}
      label="More"
    >
      <div className="px-4 pb-4">
        <ul className="divide-y divide-border/40">
          {APP_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => closeSheet()}
                className="flex items-center gap-3 py-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                  <item.Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-4 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Integrations
        </p>
        <ul className="divide-y divide-border/40">
          {EXTERNAL_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => closeSheet()}
                className="flex items-center gap-3 py-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40 ring-1 ring-inset ring-border/40 dark:bg-white/[0.04] dark:ring-white/[0.06]">
                  <img
                    src={item.iconSrc}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground/60" />
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-center text-[11px] text-muted-foreground/60">
          thesvg.org · The Open SVG Brand Library
        </p>
      </div>
    </BottomSheet>
  );
}
