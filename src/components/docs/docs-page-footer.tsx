"use client";

import { useState } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { DocsBrandIcon } from "@/components/docs/docs-nav-icon";

interface DocsPageFooterProps {
  /** Repo-relative path to the file that actually owns this page's content. */
  sourceFile: string;
  pageTitle: string;
}

export function DocsPageFooter({ sourceFile, pageTitle }: DocsPageFooterProps) {
  const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(null);

  function handleFeedback(helpful: boolean) {
    if (feedback) return;
    posthog.capture("docs_feedback", { page: pageTitle, helpful });
    setFeedback(helpful ? "helpful" : "not-helpful");
  }

  return (
    <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-6 dark:border-white/[0.06]">
      <Link
        href={`https://github.com/glincker/thesvg/edit/main/${sourceFile}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <DocsBrandIcon slug="github" className="h-3.5 w-3.5" />
        Edit this page on GitHub
      </Link>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {feedback ? (
          <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <Check className="h-3.5 w-3.5" />
            Thanks for the feedback
          </span>
        ) : (
          <>
            <span>Was this page helpful?</span>
            <button
              type="button"
              onClick={() => handleFeedback(true)}
              aria-label="Yes, this page was helpful"
              className="rounded-md p-1.5 hover:bg-accent hover:text-accent-foreground"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(false)}
              aria-label="No, this page was not helpful"
              className="rounded-md p-1.5 hover:bg-accent hover:text-accent-foreground"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
