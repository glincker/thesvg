"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/own-icons";
import posthog from "posthog-js";
import { getJsDelivrUrl } from "@/components/icons/shared/icon-constants";
import { cn } from "@/lib/utils";
import {
  PACKAGE_MANAGERS,
  type PackageManager,
  installCommand,
  isPackagePublished,
  packageForSlug,
} from "@/lib/published-packages";

interface QuickCommandsProps {
  slug: string;
  activeVariant: string;
}

type Tab = "npm" | "cli" | "cdn";
const PM_KEY = "thesvg:package-manager";

const readPm = (): PackageManager => {
  try {
    const v = window.localStorage.getItem(PM_KEY);
    return PACKAGE_MANAGERS.includes(v as PackageManager) ? (v as PackageManager) : "npm";
  } catch {
    return "npm";
  }
};

interface CodeRowProps {
  text: string;
  id: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

function CodeRow({ text, id, copied, onCopy }: CodeRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{text}</code>
      <button
        type="button"
        onClick={() => onCopy(text, id)}
        aria-label={`Copy ${id} command`}
        className="shrink-0 rounded-md p-1.5 text-orange-500 outline-none transition-colors hover:bg-orange-500/10 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied === id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/** How to use this icon: install the package, run the CLI, or link the CDN. Highlighted so it is the first thing people see. */
export function QuickCommands({ slug, activeVariant }: QuickCommandsProps) {
  const pkg = packageForSlug(slug);
  const published = isPackagePublished(pkg.name);
  const [tab, setTab] = useState<Tab>(published ? "npm" : "cli");
  const [pm, setPm] = useState<PackageManager>(() => (typeof window === "undefined" ? "npm" : readPm()));
  const [copied, setCopied] = useState<string | null>(null);

  const cdnUrl = getJsDelivrUrl(slug, activeVariant);
  const cliCommand = `npx @thesvg/cli add ${slug}`;

  const copy = (text: string, key: string): void => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
    posthog.capture("quick_command_copied", { icon_slug: slug, variant: activeVariant, command_type: key });
  };
  const choosePm = (next: PackageManager): void => {
    setPm(next);
    try {
      window.localStorage.setItem(PM_KEY, next);
    } catch {
      /* the choice just is not remembered */
    }
  };

  const tabClass = (active: boolean): string =>
    cn(
      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
      active ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <section aria-label="How to use this icon" className="rounded-xl border border-orange-500/25 bg-orange-500/[0.04] p-3 shadow-sm dark:border-orange-400/20">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">How to use</h2>
        <div role="tablist" aria-label="Install method" className="inline-flex gap-1 rounded-xl border border-border/50 bg-background/50 p-1">
          <button type="button" role="tab" aria-selected={tab === "npm"} onClick={() => setTab("npm")} className={tabClass(tab === "npm")}>
            <img src="/icons/npm/default.svg" alt="" width={14} height={14} className="size-3.5 object-contain" />
            npm
          </button>
          <button type="button" role="tab" aria-selected={tab === "cli"} onClick={() => setTab("cli")} className={tabClass(tab === "cli")}>
            <span aria-hidden="true" className="font-mono text-[11px]">&gt;_</span>
            CLI
          </button>
          <button type="button" role="tab" aria-selected={tab === "cdn"} onClick={() => setTab("cdn")} className={tabClass(tab === "cdn")}>
            <span aria-hidden="true" className="font-mono text-[11px]">&lt;/&gt;</span>
            CDN
          </button>
        </div>
      </div>

      {tab === "npm" ? (
        published ? (
          <div className="space-y-2">
            <div role="radiogroup" aria-label="Package manager" className="inline-flex gap-1 text-xs">
              {PACKAGE_MANAGERS.map((m) => (
                <button key={m} type="button" role="radio" aria-checked={pm === m} onClick={() => choosePm(m)} className={cn("rounded-md px-2 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring", pm === m ? "bg-orange-500/15 font-medium text-orange-500" : "text-muted-foreground hover:text-foreground")}>
                  {m}
                </button>
              ))}
            </div>
            <CodeRow text={installCommand(pm, pkg.name)} id="npm" copied={copied} onCopy={copy} />
            {pkg.importLine ? <CodeRow text={pkg.importLine} id="import" copied={copied} onCopy={copy} /> : null}
            <p className="text-xs text-muted-foreground">
              Not installed yet? Run this once in your project{pkg.importLine ? ", then import the component" : ", then copy the import from the React tab below"}.{" "}
              <a href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">{pkg.name} on npm</a>
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
            <code className="font-mono">{pkg.name}</code> is not on npm yet. Use the CLI or the CDN link for now; this tab fills in as soon as it is published.
          </p>
        )
      ) : null}

      {tab === "cli" ? (
        <div className="space-y-2">
          <CodeRow text={cliCommand} id="cli" copied={copied} onCopy={copy} />
          <p className="text-xs text-muted-foreground">Adds this SVG to your project. Nothing needs to be installed first.</p>
        </div>
      ) : null}

      {tab === "cdn" ? (
        <div className="space-y-2">
          <CodeRow text={cdnUrl} id="cdn" copied={copied} onCopy={copy} />
          <p className="text-xs text-muted-foreground">Use it as an image source, no build step: <code className="font-mono">&lt;img src=&quot;…&quot;&gt;</code></p>
        </div>
      ) : null}
    </section>
  );
}
