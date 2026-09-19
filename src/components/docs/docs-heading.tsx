"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";

/** h2 with a hover-reveal "#" anchor link, so a subsection has a stable,
 * copyable URL (`/docs/react#usage`) instead of only being reachable by
 * scrolling - the "SEO can link to part of the page" ask, at the
 * subsection level within a page that's already its own route. */
export function DocsHeading({ id, children }: { id: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <h2 id={id} className="group/heading mb-3 flex scroll-mt-24 items-center gap-1.5 text-base font-semibold">
      {children}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy link to ${typeof children === "string" ? children : "this section"}`}
        className="opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <LinkIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-orange-500" />
        )}
      </button>
    </h2>
  );
}
