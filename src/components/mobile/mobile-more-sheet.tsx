"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Cloud,
  ExternalLink,
  Eye,
  FileText,
  GitCompare,
  Heart,
  Layers,
  LayoutGrid,
  Shapes,
} from "@/components/own-icons";
import { BottomSheet, type BottomSheetSnap } from "./bottom-sheet";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";
import { withUtm } from "@/lib/external-link";
import { useT } from "@/i18n/use-t";

interface InternalItem {
  href: string;
  /** Translation keys, or a literal when the name is a brand or product. */
  labelKey?: string;
  label?: string;
  descKey?: string;
  description?: string;
  Icon: typeof Layers;
}

interface ExternalItem {
  href: string;
  labelKey?: string;
  label?: string;
  descKey: string;
  /** Path to a brand SVG inside the catalog itself. Dog-fooded — we
   *  serve the same files we ship to consumers. */
  iconSrc: string;
}

interface LinkSection {
  titleKey: string;
  items: ReadonlyArray<InternalItem>;
}

// Everything the desktop header and sidebar expose, grouped so the sheet
// stays scannable on a phone: browse, tools, learn, then personal lists.
const APP_SECTIONS: ReadonlyArray<LinkSection> = [
  {
    titleKey: "mobile.dock.browse",
    items: [
      {
        href: "/families",
        labelKey: "mobile.more.families",
        descKey: "mobile.more.familiesDesc",
        Icon: LayoutGrid,
      },
      {
        href: "/categories",
        labelKey: "nav.categories",
        descKey: "mobile.more.categoriesDesc",
        Icon: Shapes,
      },
      {
        href: "/collection/aws",
        label: "AWS Architecture",
        descKey: "mobile.more.awsDesc",
        Icon: Cloud,
      },
      {
        href: "/collection/azure",
        label: "Azure Services",
        descKey: "mobile.more.azureDesc",
        Icon: Cloud,
      },
      {
        href: "/collection/gcp",
        label: "Google Cloud",
        descKey: "mobile.more.gcpDesc",
        Icon: Cloud,
      },
      {
        href: "/collection/k8s",
        label: "Kubernetes",
        descKey: "mobile.more.k8sDesc",
        Icon: Cloud,
      },
      {
        href: "/collection/flags",
        labelKey: "mobile.more.flags",
        descKey: "mobile.more.flagsDesc",
        Icon: Cloud,
      },
    ],
  },
  {
    titleKey: "mobile.more.tools",
    items: [
      {
        href: "/viewer",
        labelKey: "mobile.more.viewer",
        descKey: "mobile.more.viewerDesc",
        Icon: Eye,
      },
      {
        href: "/extensions",
        labelKey: "mobile.more.extensions",
        descKey: "mobile.more.extensionsDesc",
        Icon: Layers,
      },
    ],
  },
  {
    titleKey: "mobile.more.learn",
    items: [
      {
        href: "/docs",
        labelKey: "mobile.more.docs",
        descKey: "mobile.more.docsDesc",
        Icon: BookOpen,
      },
      {
        href: "/blog",
        labelKey: "nav.blog",
        descKey: "mobile.more.blogDesc",
        Icon: FileText,
      },
      {
        href: "/compare",
        labelKey: "mobile.more.compare",
        description: "theSVG vs Simple Icons, svgl, Iconify",
        Icon: GitCompare,
      },
    ],
  },
  {
    titleKey: "mobile.more.yourIcons",
    items: [
      {
        href: "/recents",
        labelKey: "mobile.dock.recents",
        descKey: "mobile.more.recentsDesc",
        Icon: BookOpen,
      },
      {
        href: "/?favorites=true",
        labelKey: "mobile.dock.favorites",
        descKey: "mobile.more.favoritesDesc",
        Icon: Heart,
      },
    ],
  },
];

const EXTERNAL_LINKS: ReadonlyArray<ExternalItem> = [
  {
    href: "https://github.com/GLINCKER/thesvg",
    label: "GitHub",
    descKey: "mobile.more.githubDesc",
    iconSrc: "/icons/github/default.svg",
  },
  {
    href: "https://discord.gg/Ar5pcaZB99",
    label: "Discord",
    descKey: "mobile.more.discordDesc",
    iconSrc: "/icons/discord/default.svg",
  },
  {
    href: "https://www.npmjs.com/package/thesvg",
    labelKey: "mobile.more.npm",
    descKey: "mobile.more.npmDesc",
    iconSrc: "/icons/npm/default.svg",
  },
  {
    href: "https://www.raycast.com/thegdsks/thesvg",
    labelKey: "mobile.more.raycast",
    descKey: "mobile.more.raycastDesc",
    iconSrc: "/icons/raycast/default.svg",
  },
  {
    href: "https://www.figma.com/community/plugin/1612997159050367763",
    labelKey: "mobile.more.figma",
    descKey: "mobile.more.figmaDesc",
    iconSrc: "/icons/figma/default.svg",
  },
  {
    href: "https://marketplace.visualstudio.com/items?itemName=glincker.thesvg",
    labelKey: "mobile.more.vscode",
    descKey: "mobile.more.vscodeDesc",
    iconSrc: "/icons/visual-studio-code/default.svg",
  },
];

export function MobileMoreSheet() {
  const { t } = useT();
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
      label={t("mobile.dock.more")}
    >
      <div className="px-4 pb-4">
        {APP_SECTIONS.map((section, i) => (
          <div key={section.titleKey} className={i > 0 ? "mt-4" : undefined}>
            <p className="pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {t(section.titleKey)}
            </p>
            <ul className="divide-y divide-border/40">
              {section.items.map((item) => (
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
                        {item.labelKey ? t(item.labelKey) : item.label}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {item.descKey ? t(item.descKey) : item.description}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="mt-4 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          {t("mobile.more.integrations")}
        </p>
        <ul className="divide-y divide-border/40">
          {EXTERNAL_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={withUtm(item.href, "mobile_more_sheet")}
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
                    {item.labelKey ? t(item.labelKey) : item.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {t(item.descKey)}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground/60" />
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-center text-[11px] text-muted-foreground/60">
          thesvg.org · {t("mobile.more.tagline")}
        </p>
      </div>
    </BottomSheet>
  );
}
