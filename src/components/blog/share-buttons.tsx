"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  url: string;
  title: string;
  tags: string[];
  vertical?: boolean;
}

const PLATFORMS = [
  {
    name: "X",
    buildUrl: (url: string, title: string, tags: string[]) => {
      const hashtags = tags.map((t) => t.replace(/[^a-zA-Z0-9]/g, "")).join(",");
      return `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`;
    },
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    hoverColor: "hover:bg-foreground hover:text-background",
  },
  {
    name: "LinkedIn",
    buildUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    hoverColor: "hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]",
  },
  {
    name: "Reddit",
    buildUrl: (url: string, title: string) =>
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    hoverColor: "hover:bg-[#FF4500] hover:text-white hover:border-[#FF4500]",
  },
  {
    name: "HN",
    buildUrl: (url: string, title: string) =>
      `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896h-1.88z" />
      </svg>
    ),
    hoverColor: "hover:bg-[#ff6600] hover:text-white hover:border-[#ff6600]",
  },
];

export function ShareButtons({ url, title, tags, vertical = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    posthog.capture("blog_link_copied", { url });
  };

  const handleShare = (platform: string) => {
    posthog.capture("blog_post_shared", { platform, url });
  };

  if (vertical) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="mb-1 -rotate-90 whitespace-nowrap text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">
          Share
        </p>

        {PLATFORMS.map((platform) => (
          <a
            key={platform.name}
            href={platform.buildUrl(url, title, tags)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${platform.name}`}
            onClick={() => handleShare(platform.name)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 text-muted-foreground/60 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md dark:border-white/[0.08]",
              platform.hoverColor
            )}
          >
            {platform.icon}
          </a>
        ))}

        {/* Divider */}
        <div className="my-1 h-6 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent dark:via-white/[0.06]" />

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          title="Copy link"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md",
            copied
              ? "border-green-500/40 bg-green-500/10 text-green-500"
              : "border-border/50 text-muted-foreground/60 hover:bg-accent hover:text-foreground dark:border-white/[0.08]"
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  // Horizontal layout (mobile)
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PLATFORMS.map((platform) => (
        <a
          key={platform.name}
          href={platform.buildUrl(url, title, tags)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShare(platform.name)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 dark:border-white/[0.08]",
            platform.hoverColor
          )}
        >
          {platform.icon}
          {platform.name}
        </a>
      ))}

      <button
        onClick={handleCopyLink}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200",
          copied
            ? "border-green-500/30 bg-green-500/10 text-green-500"
            : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground dark:border-white/[0.08]"
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
