"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  Heart,
  Layers,
  Package,
} from "lucide-react";
import { BottomSheet } from "./bottom-sheet";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";

interface MoreItem {
  href: string;
  label: string;
  description: string;
  Icon: typeof Package;
  external?: boolean;
}

const APP_LINKS: ReadonlyArray<MoreItem> = [
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

const EXTERNAL_LINKS: ReadonlyArray<MoreItem> = [
  {
    href: "https://github.com/GLINCKER/thesvg",
    label: "GitHub",
    description: "Source and issues",
    Icon: Package,
    external: true,
  },
  {
    href: "https://www.npmjs.com/package/thesvg",
    label: "npm package",
    description: "thesvg on npm",
    Icon: Package,
    external: true,
  },
  {
    href: "https://www.raycast.com/thegdsks/thesvg",
    label: "Raycast extension",
    description: "Search icons from Raycast",
    Icon: Package,
    external: true,
  },
  {
    href: "https://www.figma.com/community/plugin/1612997159050367763",
    label: "Figma plugin",
    description: "Drop icons into your Figma file",
    Icon: Package,
    external: true,
  },
  {
    href: "https://marketplace.visualstudio.com/items?itemName=glincker.thesvg",
    label: "VS Code extension",
    description: "Search and copy from VS Code",
    Icon: Package,
    external: true,
  },
];

/**
 * "More" sheet — overflow for everything that doesn't fit in the dock
 * or top bar on mobile. Replaces the desktop header's icon cluster
 * (GitHub, npm, Raycast, Figma, VS Code, Extensions link).
 */
export function MobileMoreSheet() {
  const sheet = useMobileShellStore((s) => s.sheet);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);
  const open = sheet === "more";

  return (
    <BottomSheet open={open} onClose={closeSheet} fixedSnap="half" label="More">
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
