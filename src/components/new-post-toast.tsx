"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, X } from "@phosphor-icons/react/dist/ssr";

interface LatestPost {
  slug: string;
  title: string;
  date: string;
}

const STORAGE_KEY = "thesvg-last-seen-post-date";
const SHOW_DELAY_MS = 1500;
const AUTO_DISMISS_MS = 8000;

export function NewPostToast({ post }: { post: LatestPost | undefined }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!post) return;

    let lastSeen: string | null = null;
    try {
      lastSeen = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked
    }
    if (!lastSeen || new Date(post.date) > new Date(lastSeen)) {
      const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [post]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    setDismissed(true);
    if (!post) return;
    try {
      localStorage.setItem(STORAGE_KEY, post.date);
    } catch {
      // storage blocked
    }
  }

  if (!post || !visible || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-6 z-50 flex max-w-xs items-start gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-500 dark:border-white/[0.08] dark:bg-black/80"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
        <Newspaper className="h-4 w-4 text-orange-500" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">New post</p>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {post.title}
        </p>
        <Link
          href={`/blog/${post.slug}`}
          onClick={dismiss}
          className="inline-block text-xs font-medium text-orange-500 transition-opacity hover:opacity-70"
        >
          Read
        </Link>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
