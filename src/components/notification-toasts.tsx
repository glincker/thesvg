"use client";

import { useEffect, useState } from "react";
import { NewPostToast } from "@/components/new-post-toast";
import { ImprovementsToast } from "@/components/improvements-toast";

interface LatestPost {
  slug: string;
  title: string;
  date: string;
}

const POST_SEEN_KEY = "thesvg-last-seen-post-date";
// NewPostToast shows 1.5s after mount and auto-dismisses 8s later; this
// clears the bottom-left corner with a little buffer to spare.
const IMPROVEMENTS_DELAY_AFTER_POST_TOAST_MS = 11000;

export function NotificationToasts({ post }: { post: LatestPost | undefined }) {
  const [postToastPending, setPostToastPending] = useState<boolean | null>(null);

  useEffect(() => {
    if (!post) {
      setPostToastPending(false);
      return;
    }
    let lastSeen: string | null = null;
    try {
      lastSeen = localStorage.getItem(POST_SEEN_KEY);
    } catch {
      // storage blocked
    }
    setPostToastPending(!lastSeen || new Date(post.date) > new Date(lastSeen));
  }, [post]);

  // Both toasts can occupy overlapping space on narrow viewports, so hold
  // off rendering either until we know whether the post toast will claim
  // the bottom-left corner - that decides how long the improvements toast
  // should wait before it's safe to show in the opposite corner.
  if (postToastPending === null) return null;

  return (
    <>
      <NewPostToast post={post} />
      <ImprovementsToast
        delayMs={postToastPending ? IMPROVEMENTS_DELAY_AFTER_POST_TOAST_MS : undefined}
      />
    </>
  );
}
