"use client";

import { useState } from "react";
import { Check, Link2, SocialLinkedin, SocialReddit, SocialX } from "@/components/own-icons";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";
import { withUtm } from "@/lib/external-link";

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
    icon: <SocialX className="size-4" />,
    hoverColor: "hover:bg-foreground hover:text-background",
  },
  {
    name: "LinkedIn",
    buildUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: <SocialLinkedin className="size-4" />,
    hoverColor: "hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]",
  },
  {
    name: "Reddit",
    buildUrl: (url: string, title: string) =>
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    icon: <SocialReddit className="size-4" />,
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
            href={withUtm(platform.buildUrl(url, title, tags), "blog_share")}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${platform.name}`}
            aria-label={`Share on ${platform.name}`}
            onClick={() => handleShare(platform.name)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 text-muted-foreground/60 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/[0.08]",
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
          aria-label="Copy link"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
          href={withUtm(platform.buildUrl(url, title, tags), "blog_share")}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShare(platform.name)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/[0.08]",
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
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
