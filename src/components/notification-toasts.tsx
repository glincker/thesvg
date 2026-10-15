"use client";

import { NewPostToast } from "@/components/new-post-toast";

interface LatestPost {
  slug: string;
  title: string;
  date: string;
}

/** Surfaces the newest blog post once per visitor; it has its own seen-state. */
export function NotificationToasts({ post }: { post: LatestPost | undefined }) {
  return <NewPostToast post={post} />;
}
