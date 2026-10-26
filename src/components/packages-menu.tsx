"use client";

import { Check, ChevronDown, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GROUP_TITLES, PACKAGES, type PackageEntry, installCommand } from "@/lib/packages-list";
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
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[300px] p-0">
        <div className="max-h-[70vh] overflow-y-auto p-1.5">
          {groups.map((g, gi) => (
            <div key={g} className={cn(gi > 0 && "mt-1 border-t border-border/40 pt-1")}>
              <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{GROUP_TITLES[g]}</p>
              {PACKAGES.filter((p) => p.group === g).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => copy(p.name)}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs text-foreground">{p.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{p.label}</span>
                  </span>
                  {copied === p.name ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground" />}
                </button>
              ))}
            </div>
          ))}
        </div>
        <Link href="/packages" className="block border-t border-border/40 px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          All packages and install commands
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
