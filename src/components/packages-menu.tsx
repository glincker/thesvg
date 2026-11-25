"use client";

import { UiGlyph } from "@/components/ui-glyph";
import Link from "next/link";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GROUP_TITLES, PACKAGES, type PackageEntry, installCommand, npmUrl } from "@/lib/packages-list";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";

const SHOWN: PackageEntry["group"][] = ["brand", "ui", "flags"];

// English package labels mapped to locale keys; framework names stay as-is.
const LABEL_KEYS: Record<string, string> = {
  "Everything in one": "everything",
  "Raw SVG data": "rawData",
  "Plain JavaScript": "plainJs",
  "Raw SVG files for CDN": "cdnFiles",
  "Raw files and manifest": "rawManifest",
  "Country and region flags": "flags",
  "Command line": "cli",
  "MCP server": "mcp",
};

const size = (g: PackageEntry["group"]): number => PACKAGES.filter((p) => p.group === g).length;

/** Two columns with the lead group first in the first one; the other groups are placed to even out the heights. */
function splitColumns(lead: PackageEntry["group"]): PackageEntry["group"][][] {
  const rest = SHOWN.filter((g) => g !== lead);
  let best: PackageEntry["group"][][] = [[lead, ...rest], []];
  let bestGap = Infinity;
  for (let mask = 0; mask < 1 << rest.length; mask++) {
    const first = [lead, ...rest.filter((_, i) => mask & (1 << i))];
    const second = rest.filter((_, i) => !(mask & (1 << i)));
    const gap = Math.abs(first.reduce((n, g) => n + size(g), 0) - second.reduce((n, g) => n + size(g), 0));
    if (gap < bestGap && second.length > 0) {
      best = [first, second];
      bestGap = gap;
    }
  }
  return best;
}

/** Header menu for the npm packages. The group for the section you are in comes first; two columns keep it all in view. */
export function PackagesMenu({ lead }: { lead: PackageEntry["group"] }) {
  const { t } = useT();
  const [copied, setCopied] = useState<string | null>(null);
  const columns = splitColumns(lead);
  const copy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(installCommand(name));
      setCopied(name);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t("chrome.packages.aria")}
            title={t("chrome.packages.aria")}
            className="hidden h-8 items-center gap-1 rounded-lg border border-border/50 px-1.5 text-muted-foreground transition-all hover:border-[#cb3837]/30 hover:bg-[#cb3837]/5 hover:text-[#cb3837] lg:inline-flex dark:border-white/[0.06] dark:hover:border-[#cb3837]/30"
          />
        }
      >
        <img src="/icons/npm/default.svg" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
        <UiGlyph name="chevron-down" className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[min(40rem,calc(100vw-2rem))] p-0">
        <div className="grid max-h-[80vh] gap-x-2 overflow-y-auto p-1.5 sm:grid-cols-2">
          {columns.map((col, ci) => (
            <div key={ci} className="min-w-0">
              {col.map((g, gi) => (
            <div key={g} className={cn(gi > 0 && "mt-3")}>
              <p className="px-2 pb-1 pt-1.5 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground/70">{t(`chrome.packages.group.${g}`, { defaultValue: GROUP_TITLES[g] })}</p>
              {PACKAGES.filter((p) => p.group === g).map((p) => (
                <div key={p.name} className="group flex items-center gap-1 rounded-lg transition-colors hover:bg-accent/60 focus-within:bg-accent/60">
                  <button
                    type="button"
                    onClick={() => copy(p.name)}
                    aria-label={t("chrome.packages.copyAria", { name: p.name })}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-xs text-foreground">{p.name}</span>
                      <span className="block text-[0.75rem] text-muted-foreground">{LABEL_KEYS[p.label] ? t(`chrome.packages.label.${LABEL_KEYS[p.label]}`) : p.label}</span>
                    </span>
                    {copied === p.name ? <UiGlyph name="check" className="size-5 text-emerald-500" /> : <UiGlyph name="copy" className="size-5 text-muted-foreground group-hover:text-foreground" />}
                  </button>
                  <a
                    href={npmUrl(p.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("chrome.packages.openAria", { name: p.name })}
                    title={t("chrome.packages.openTitle")}
                    className="mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <UiGlyph name="external-link" className="size-5" />
                  </a>
                </div>
              ))}
            </div>
              ))}
            </div>
          ))}
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {copied ? t("chrome.packages.copiedStatus", { name: copied }) : ""}
        </p>
        <Link href="/packages" className="block border-t border-border/40 px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          {t("chrome.packages.all")}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
