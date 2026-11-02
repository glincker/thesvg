"use client";

import { UiGlyph } from "@/components/ui-glyph";
import { useMemo, useState } from "react";
import type { Variant } from "@/lib/ui-icons/engine";
import { COPY_TABS, PACKAGE_TABS, SOURCE_TABS, USE_TABS, codeFor, installCommand, packageCode, type PackageTab, type SnippetTab, type SourceTab } from "@/lib/ui-icons/snippets";
import { colorizeCode } from "@/lib/ui-icons/syntax";
import { cn } from "@/lib/ui-icons/utils";

const LABELS: Record<SnippetTab, string> = { react: "React", vue: "Vue", svelte: "Svelte", native: "React Native", js: "JS / CDN", html: "HTML", css: "CSS mask", svg: "SVG", uri: "Data URI" };
const LOGOS: Partial<Record<SnippetTab, string>> = { react: "react", vue: "vue", svelte: "svelte", native: "react", js: "javascript", html: "html5", css: "css" };

const isPackageTab = (t: SnippetTab): t is PackageTab => (PACKAGE_TABS as readonly SnippetTab[]).includes(t);
const hasSource = (t: SnippetTab): t is SourceTab & (typeof SOURCE_TABS)[number] => (SOURCE_TABS as readonly SnippetTab[]).includes(t);

/** Same structure as the brand icon page: usage tabs, a divider, copy formats, a dark code surface. */
export function CodeBlock(props: { svg: string; slug: string; look: Variant; customized: boolean }) {
  const [tab, setTab] = useState<SnippetTab>("react");
  const [source, setSource] = useState(false);
  // Package usage is the default. Custom weight, corners or scale only exist in the copied source, so that view is one click away.
  const showSource = hasSource(tab) && source;
  const [copied, setCopied] = useState(false);
  const code = useMemo(
    () => (isPackageTab(tab) && !showSource ? packageCode(tab, props.slug, props.look) : codeFor(tab as SourceTab, props.svg, props.slug)),
    [tab, showSource, props.svg, props.slug, props.look],
  );
  const rendered = useMemo(() => colorizeCode(code, tab), [code, tab]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const pill = (t: SnippetTab, withLogo: boolean) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.75rem] font-medium transition-colors",
        tab === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {withLogo && LOGOS[t] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/icons/${LOGOS[t]}/default.svg`} alt="" className="size-3" />
      )}
      {LABELS[t]}
    </button>
  );
  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3">
        <div className="flex flex-wrap gap-1.5">{USE_TABS.map((t) => pill(t, true))}</div>
        <div className="h-4 w-px shrink-0 bg-border" />
        <div className="flex flex-wrap gap-1.5">{COPY_TABS.map((t) => pill(t, false))}</div>
      </div>
      {isPackageTab(tab) && (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2 text-[0.75rem]">
          {hasSource(tab) && (
            <div className="flex gap-1" role="group" aria-label="Code form">
              {([false, true] as const).map((src) => (
                <button
                  key={String(src)}
                  type="button"
                  aria-pressed={source === src}
                  onClick={() => setSource(src)}
                  className={cn("rounded-md px-2 py-0.5 font-medium transition-colors", source === src ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                >
                  {src ? "Source" : "Package"}
                </button>
              ))}
            </div>
          )}
          {!showSource && <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-muted-foreground">{installCommand(tab)}</code>}
          {props.customized && !showSource && <span className="text-amber-400">Custom style only applies to the copied source.</span>}
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={copy}
          className={cn(
            "absolute right-3 top-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[0.75rem] font-medium transition-colors",
            copied ? "bg-green-500/10 text-green-400" : "bg-orange-500/15 text-orange-400 backdrop-blur-sm hover:bg-orange-500/25 hover:text-orange-300",
          )}
        >
          {copied ? <UiGlyph name="check" className="size-3.5" /> : <UiGlyph name="copy" className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <div className="bg-zinc-950">
          <pre className="max-h-64 overflow-auto p-4 pr-16 font-mono text-[0.75rem] leading-6 text-zinc-300">
            <code className="block whitespace-pre-wrap break-all">{rendered}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
