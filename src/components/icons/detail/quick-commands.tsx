"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import posthog from "posthog-js";
import { getJsDelivrUrl } from "@/components/icons/shared/icon-constants";

interface QuickCommandsProps {
  slug: string;
  activeVariant: string;
}

export function QuickCommands({ slug, activeVariant }: QuickCommandsProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const cdnUrl = getJsDelivrUrl(slug, activeVariant);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 1500);
    posthog.capture("quick_command_copied", {
      icon_slug: slug,
      variant: activeVariant,
      command_type: key,
    });
  };

  return (
    <div className="space-y-1.5">
      {/* CLI */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
        <span className="shrink-0 rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-orange-500">
          CLI
        </span>
        <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
          npx @thesvg/cli add {slug}
        </code>
        <button
          type="button"
          onClick={() =>
            copyToClipboard(`npx @thesvg/cli add ${slug}`, "cli")
          }
          className="shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          {copiedCmd === "cli" ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* CDN */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
        <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-500">
          CDN
        </span>
        <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
          {cdnUrl.replace("https://", "")}
        </code>
        <button
          type="button"
          onClick={() => copyToClipboard(cdnUrl, "cdn")}
          className="shrink-0 rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          {copiedCmd === "cdn" ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
}
