"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { colorizeSnippet } from "@/components/icons/shared/syntax-highlight";
import type { DocsSnippet } from "@/lib/docs-content";

type CopyStatus = "idle" | "copied" | "failed";

const STATUS_BUTTON_CLASS: Record<CopyStatus, string> = {
  copied: "bg-green-500/10 text-green-600 dark:text-green-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  idle: "bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 hover:text-orange-400",
};

const STATUS_LABEL: Record<CopyStatus, string> = {
  copied: "Copied",
  failed: "Couldn't copy",
  idle: "Copy",
};

export function DocsCodeBlock({ snippet }: Readonly<{ snippet: DocsSnippet }>) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const handleCopy = useCallback(async () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(snippet.code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    resetTimer.current = setTimeout(() => setStatus("idle"), 1500);
  }, [snippet.code]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/30 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <span className="text-[11px] font-medium text-muted-foreground">{snippet.label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${STATUS_BUTTON_CLASS[status]}`}
        >
          {status === "copied" && <Check className="h-3 w-3" />}
          {status === "failed" && <X className="h-3 w-3" />}
          {status === "idle" && <Copy className="h-3 w-3" />}
          {STATUS_LABEL[status]}
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
