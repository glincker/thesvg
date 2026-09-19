"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocsBrandIcon } from "@/components/docs/docs-nav-icon";

interface AiTarget {
  label: string;
  iconSlug: string;
  buildUrl: (query: string) => string;
}

// URL-prefill patterns for each product's "start a new chat/search with
// this text" entry point. These are third-party URL schemes we don't
// control - if a provider changes theirs, this button degrades to just
// opening that product's homepage with the query lost, not breaking.
// ChatGPT uses OpenAI's mark - theSVG doesn't carry a separate "chatgpt" slug.
const AI_TARGETS: AiTarget[] = [
  { label: "ChatGPT", iconSlug: "openai", buildUrl: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}` },
  { label: "Claude", iconSlug: "claude", buildUrl: (q) => `https://claude.ai/new?q=${encodeURIComponent(q)}` },
  { label: "Perplexity", iconSlug: "perplexity", buildUrl: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}` },
];

export function DocsAskAi({ pageTitle }: Readonly<{ pageTitle: string }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const query = `Read ${pageUrl} and help me use theSVG's ${pageTitle} guide in my project.`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-orange-500/30 hover:text-foreground dark:border-white/[0.08]"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Ask AI
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-xl border border-border/60 bg-background shadow-lg dark:border-white/[0.1] dark:bg-[#0f0f10]">
          {AI_TARGETS.map((target) => (
            <a
              key={target.label}
              href={target.buildUrl(query)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <DocsBrandIcon slug={target.iconSlug} className="h-3.5 w-3.5 shrink-0" />
              Open in {target.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
