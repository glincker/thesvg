"use client";

import { useEffect, useState } from "react";
import { GITHUB_REPO_API, parseStarCount } from "@/lib/github-stars";

const CACHE_KEY = "thesvg-github-stars";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CachedStars {
  count: number;
  at: number;
}

function readCache(): CachedStars | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { count, at } = parsed as Partial<CachedStars>;
    return typeof count === "number" && typeof at === "number" ? { count, at } : null;
  } catch {
    return null;
  }
}

function writeCache(count: number): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ count, at: Date.now() }));
  } catch {
    // Storage can be blocked; the count just refetches next visit.
  }
}

/**
 * Star count for the repo. Starts from the build-time value, then refreshes
 * from the GitHub API at most once per cache window. Never throws.
 */
export function useGithubStars(initial: number | null): number | null {
  const [stars, setStars] = useState<number | null>(initial);

  useEffect(() => {
    const controller = new AbortController();

    const refresh = async (): Promise<void> => {
      const cached = readCache();
      if (cached) {
        setStars((current) => (current === null || cached.count > current ? cached.count : current));
        if (Date.now() - cached.at < CACHE_TTL_MS) return;
      }
      try {
        const res = await fetch(GITHUB_REPO_API, {
          headers: { Accept: "application/vnd.github+json" },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const count = parseStarCount(await res.json());
        if (count === null) return;
        writeCache(count);
        setStars(count);
      } catch {
        // Offline, rate limited or aborted: keep whatever we have.
      }
    };

    void refresh();
    return () => controller.abort();
  }, []);

  return stars;
}
