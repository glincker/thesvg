"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "@/components/own-icons";
import { useT } from "@/i18n/use-t";

/** h2 with a hover-reveal "#" anchor link, so a subsection has a stable,
 * copyable URL (`/docs/react#usage`) instead of only being reachable by
 * scrolling - the "SEO can link to part of the page" ask, at the
 * subsection level within a page that's already its own route. */
export function DocsHeading({ id, k, children }: Readonly<{ id: string; k?: string; children: string }>) {
  const [copied, setCopied] = useState(false);
  const { t } = useT();
  const text = k ? t(k, { defaultValue: children }) : children;

  async function handleCopy() {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <h2 id={id} className="group/heading mb-3 flex scroll-mt-24 items-center gap-1.5 text-base font-semibold">
      {text}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t("docs.ui.copyLinkTo", { defaultValue: "Copy link to {{title}}", title: text })}
        className="rounded opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
