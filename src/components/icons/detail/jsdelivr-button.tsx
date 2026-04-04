"use client";

import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import posthog from "posthog-js";
import { getJsDelivrUrl } from "@/components/icons/shared/icon-constants";
import { cn } from "@/lib/utils";

interface JsDelivrButtonProps {
  slug: string;
  activeVariant: string;
}

export function JsDelivrButton({ slug, activeVariant }: JsDelivrButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const url = getJsDelivrUrl(slug, activeVariant);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    posthog.capture("jsdelivr_url_copied", {
      icon_slug: slug,
      variant: activeVariant,
    });
  }, [slug, activeVariant]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy jsDelivr CDN URL"
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all duration-150",
        copied
          ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <img
          src="/icons/jsdelivr/default.svg"
          alt=""
          className="h-4 w-4"
        />
      )}
      <span className="hidden sm:inline">{copied ? "Copied" : "jsDelivr"}</span>
    </button>
  );
}
