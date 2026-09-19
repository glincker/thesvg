"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { colorizeSnippet } from "@/components/icons/shared/syntax-highlight";
import type { DocsSnippet } from "@/lib/docs-content";

export function DocsCodeBlock({ snippet }: { snippet: DocsSnippet }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [snippet.code]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/30 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <span className="text-[11px] font-medium text-muted-foreground">{snippet.label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            copied
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 hover:text-orange-400"
          }`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="bg-zinc-950">
        <pre className="overflow-auto p-4 font-mono text-[11px] leading-6 text-zinc-300">
          <code className="block whitespace-pre">
            {snippet.format ? colorizeSnippet(snippet.code, snippet.format) : snippet.code}
          </code>
        </pre>
      </div>
    </div>
  );
}
