"use client";

import { UiGlyph } from "@/components/ui-glyph";
import Link from "next/link";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GROUP_TITLES, PACKAGES, type PackageEntry, installCommand, npmUrl } from "@/lib/packages-list";
import { cn } from "@/lib/utils";

const SHOWN: PackageEntry["group"][] = ["brand", "ui"];

/** Header menu for the npm packages. Leads with the group for the section you are in and copies the install command. */
export function PackagesMenu({ inUi }: { inUi: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const groups = inUi ? [...SHOWN].reverse() : SHOWN;
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
            aria-label="npm packages"
            title="npm packages"
            className="hidden h-8 items-center gap-1 rounded-lg border border-border/50 px-1.5 text-muted-foreground transition-all hover:border-[#cb3837]/30 hover:bg-[#cb3837]/5 hover:text-[#cb3837] lg:inline-flex dark:border-white/[0.06] dark:hover:border-[#cb3837]/30"
          />
        }
      >
        <img src="/icons/npm/default.svg" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
        <UiGlyph name="chevron-down" className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[300px] p-0">
        <div className="max-h-[70vh] overflow-y-auto p-1.5">
          {groups.map((g, gi) => (
            <div key={g} className={cn(gi > 0 && "mt-1 border-t border-border/40 pt-1")}>
              <p className="px-2 pb-1 pt-1.5 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground/70">{GROUP_TITLES[g]}</p>
              {PACKAGES.filter((p) => p.group === g).map((p) => (
                <div key={p.name} className="group flex items-center gap-1 rounded-lg transition-colors hover:bg-accent/60 focus-within:bg-accent/60">
                  <button
                    type="button"
                    onClick={() => copy(p.name)}
                    aria-label={`Copy install command for ${p.name}`}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-xs text-foreground">{p.name}</span>
                      <span className="block text-[0.75rem] text-muted-foreground">{p.label}</span>
                    </span>
                    {copied === p.name ? <UiGlyph name="check" className="size-5 text-emerald-500" /> : <UiGlyph name="copy" className="size-5 text-muted-foreground group-hover:text-foreground" />}
                  </button>
                  <a
                    href={npmUrl(p.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${p.name} on npm`}
                    title="Open on npm"
                    className="mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <UiGlyph name="external-link" className="size-5" />
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {copied ? `Copied install command for ${copied}` : ""}
        </p>
        <Link href="/packages" className="block border-t border-border/40 px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          All packages and install commands
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
