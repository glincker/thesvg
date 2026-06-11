"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import type { IconEntry } from "@/lib/icons";
import { loadIconsManifest } from "@/lib/icons-manifest";
import { useRecentsStore } from "@/lib/stores/recents-store";

interface UseIconSearchOptions {
  query: string;
  source: string;
  limit?: number;
  /**
   * Debounce window for recording the query into the recents store and
   * firing analytics. 700ms matches the existing header behavior.
   */
  recordDelayMs?: number;
}

interface UseIconSearchResult {
  results: IconEntry[];
  isLoading: boolean;
  error: boolean;
}

/**
 * Fire-and-forget GA4 search event. Safe before gtag loads.
 */
function gaSearch(query: string): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (cmd: string, event: string, params: Record<string, unknown>) => void;
  };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", "search", { search_term: query });
}

/**
 * Shared Fuse.js-backed icon search. Lazy-loads the manifest and search
 * module on first non-empty query, debounces analytics, returns results.
 *
 * Consumers: desktop combobox in `<Header>`, mobile fullscreen search sheet.
 * Keeping one hook means both surfaces stay in lockstep on ranking, debounce,
 * and observability without duplicating Fuse config.
 */
export function useIconSearch(options: UseIconSearchOptions): UseIconSearchResult {
  const { query, source, limit = 24, recordDelayMs = 700 } = options;
  const recordSearch = useRecentsStore((s) => s.recordSearch);

  const [results, setResults] = useState<IconEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Track the last query we've recorded so we don't double-fire analytics
  // on re-renders that don't change the input.
  const lastRecordedRef = useRef<string>("");

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;

  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(false);
    Promise.all([loadIconsManifest(), import("@/lib/search")])
      .then(([icons, { searchIcons }]) => {
        if (!active) return;
        setResults(searchIcons(icons, trimmed).slice(0, limit));
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setResults([]);
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trimmed, hasQuery, limit]);

  // Debounced recents + analytics recording. Mirrors `<Header>` so the
  // mobile sheet doesn't quietly skip writes.
  useEffect(() => {
    if (!hasQuery) return;
    if (lastRecordedRef.current === trimmed) return;
    const id = window.setTimeout(() => {
      lastRecordedRef.current = trimmed;
      recordSearch(trimmed);
      posthog.capture("icon_searched", {
        query: trimmed,
        query_length: trimmed.length,
        source,
      });
      gaSearch(trimmed);
    }, recordDelayMs);
    return () => window.clearTimeout(id);
  }, [trimmed, hasQuery, recordSearch, source, recordDelayMs]);

  return { results, isLoading, error };
}
