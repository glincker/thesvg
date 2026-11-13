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

const PM_KEY = "thesvg:package-manager";

const readPm = (): PackageManager => {
  try {
    const v = window.localStorage.getItem(PM_KEY);
    return PACKAGE_MANAGERS.includes(v as PackageManager) ? (v as PackageManager) : "npm";
  } catch {
    return "npm";
  }
};

const SUBCOMMANDS = new Set(["install", "add", "i", "run", "dlx", "exec"]);

/** Splits a command or URL into colored parts, so the line reads at a glance. */
function Highlighted({ text }: { text: string }) {
  if (/^https?:\/\//.test(text)) {
    const m = /^(https?:\/\/)([^/]+)(.*)$/.exec(text);
    if (m) {
      return (
        <>
          <span className="text-muted-foreground">{m[1]}</span>
          <span className="text-sky-400">{m[2]}</span>
          <span className="text-emerald-400">{m[3]}</span>
        </>
      );
    }
  }
  return (
    <>
      {text.split(" ").map((word, i) => {
        const tone =
          i === 0 ? "text-orange-400"
          : word.startsWith("@") || (i > 1 && /^[a-z][\w.-]*$/i.test(word)) ? "text-emerald-400"
          : SUBCOMMANDS.has(word) ? "text-violet-400"
          : word.startsWith("-") ? "text-sky-400"
          : "text-foreground";
        return <span key={i} className={tone}>{i > 0 ? " " : ""}{word}</span>;
      })}
    </>
  );
}

interface CodeRowProps {
  text: string;
  id: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

function CodeRow({ text, id, copied, onCopy }: CodeRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-1">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground"><Highlighted text={text} /></code>
      <button
        type="button"
        onClick={() => onCopy(text, id)}
        aria-label={`Copy ${id} command`}
        className="shrink-0 rounded-md p-1 text-orange-500 outline-none transition-colors hover:bg-orange-500/10 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied === id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/** How to use this icon: install the package, run the CLI, or link the CDN, all visible at once. */
export function QuickCommands({ slug, activeVariant }: QuickCommandsProps) {
  const pkg = packageForSlug(slug);
  const published = isPackagePublished(pkg.name);
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

  return (
    <section aria-label="How to use this icon" className="rounded-xl border border-orange-500/25 bg-orange-500/[0.04] p-3 shadow-sm dark:border-orange-400/20">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">How to use</h2>
        {published ? (
          <div role="radiogroup" aria-label="Package manager" className="inline-flex gap-0.5 text-xs">
        {PACKAGE_MANAGERS.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={pm === m} onClick={() => choosePm(m)} className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring", pm === m ? "bg-orange-500/15 font-medium text-orange-500" : "text-muted-foreground hover:text-foreground")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/icons/${m}/default.svg`} alt="" width={14} height={14} className="size-3.5 object-contain" />
            {m}
          </button>
        ))}
      </div>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span className="flex w-20 shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/npm/default.svg" alt="" width={14} height={14} className="size-3.5 object-contain" />
            npm
          </span>
          {published ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <CodeRow text={installCommand(pm, pkg.name)} id="npm" copied={copied} onCopy={copy} />
              {pkg.importLine ? <CodeRow text={pkg.importLine} id="import" copied={copied} onCopy={copy} /> : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground"><code className="font-mono">{pkg.name}</code> is not on npm yet. Use the CLI or CDN.</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span className="flex w-20 shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground"><span aria-hidden="true" className="font-mono text-[11px]">&gt;_</span>CLI</span>
          <div className="min-w-0 flex-1"><CodeRow text={cliCommand} id="cli" copied={copied} onCopy={copy} /></div>
        </div>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span className="flex w-20 shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground"><span aria-hidden="true" className="font-mono text-[11px]">&lt;/&gt;</span>CDN</span>
          <div className="min-w-0 flex-1"><CodeRow text={cdnUrl} id="cdn" copied={copied} onCopy={copy} /></div>
        </div>
      </div>
    </section>
  );
}
