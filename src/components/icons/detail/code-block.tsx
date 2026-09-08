"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CopyFormat } from "@/lib/copy-formats";
import { formatSvg } from "@/lib/copy-formats";
import { generateSnippet, type SnippetFormat } from "@/lib/code-snippets";
import { colorizeSvgCode, colorizeSnippet } from "@/components/icons/shared/syntax-highlight";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  svgContent: string;
  slug: string;
  title: string;
  activeVariant: string;
}

type TabValue = CopyFormat | SnippetFormat;

interface Tab {
  value: TabValue;
  label: string;
  iconSlug?: string;
  group: "use" | "copy";
}

const TABS: Tab[] = [
  { value: "react", label: "React", iconSlug: "react", group: "use" },
  { value: "vue", label: "Vue", iconSlug: "vue", group: "use" },
  { value: "html", label: "HTML", iconSlug: "html5", group: "use" },
  { value: "nextjs", label: "Next.js", iconSlug: "nextdotjs", group: "use" },
  { value: "css", label: "CSS", iconSlug: "css", group: "use" },
  { value: "svg", label: "SVG", group: "copy" },
  { value: "jsx", label: "JSX", group: "copy" },
  { value: "cdn", label: "CDN", group: "copy" },
  { value: "data-uri", label: "URI", group: "copy" },
];

const SNIPPET_FORMATS = new Set<string>(["react", "vue", "html", "nextjs", "css"]);
const SVG_LIKE = new Set<string>(["svg", "jsx", "vue"]);

function formatSvgCode(raw: string): string {
  return raw
    .replace(/>\s*</g, ">\n<")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function CodeBlock({ svgContent, slug, title, activeVariant }: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("svg");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!svgContent) return "";
    if (SNIPPET_FORMATS.has(activeTab)) {
      return generateSnippet(slug, title, activeTab as SnippetFormat, activeVariant);
    }
    const raw = formatSvg(svgContent, activeTab as CopyFormat, slug, activeVariant);
    return activeTab === "svg" ? formatSvgCode(raw) : raw;
  }, [svgContent, activeTab, slug, title, activeVariant]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    let text = output;
    if (!SNIPPET_FORMATS.has(activeTab) && activeTab === "svg") {
      text = formatSvg(svgContent, "svg", slug, activeVariant);
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output, svgContent, activeTab, slug, activeVariant]);

  const renderCode = useMemo(() => {
    if (!output) return null;
    if (SNIPPET_FORMATS.has(activeTab)) {
      return colorizeSnippet(output, activeTab as SnippetFormat);
    }
    if (SVG_LIKE.has(activeTab)) {
      return colorizeSvgCode(output);
    }
    return output;
  }, [output, activeTab]);

  if (!svgContent) return null;

  const useTabs = TABS.filter((t) => t.group === "use");
  const copyTabs = TABS.filter((t) => t.group === "copy");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/30 shadow-sm">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/50 px-4 py-3">
        {/* Usage tabs */}
        <div className="flex flex-wrap gap-1.5">
          {useTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {tab.iconSlug && (
                <img
                  src={`/icons/${tab.iconSlug}/default.svg`}
                  alt=""
                  className={cn(
                    "h-3 w-3",
                    activeTab === tab.value
                      ? "brightness-0 invert dark:invert-0"
                      : "dark:invert"
                  )}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px shrink-0 bg-border" />

        {/* Copy format tabs */}
        <div className="flex flex-wrap gap-1.5">
          {copyTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code output */}
      <div className="relative">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "absolute top-2 right-3 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
            copied
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-orange-500/15 text-orange-400 backdrop-blur-sm hover:bg-orange-500/25 hover:text-orange-300"
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <div className="bg-zinc-950">
          <pre className="max-h-56 overflow-auto p-4 pr-16 font-mono text-[11px] leading-6 text-zinc-300">
            <code className="block whitespace-pre-wrap break-all">
              {renderCode}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
