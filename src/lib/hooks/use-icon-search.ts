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
   * Debounce window before running Fuse. Keeps fast typing from scanning the
   * ~7,400-icon index on every keystroke. 150ms matches the prior header path.
   */
  searchDelayMs?: number;
  /**
   * Debounce window for recording the query into the recents store and
   * firing analytics. 700ms matches the existing header behavior.
   */
  recordDelayMs?: number;
  /** Return flags separately so they never push brand icons down the list. Off by default (the mobile sheet shows one list). */
  splitFlags?: boolean;
  /** How many flags to return when `splitFlags` is on. */
  flagLimit?: number;
}

interface UseIconSearchResult {
  results: IconEntry[];
  /** Full match count before `limit` is applied, drives "View all N". */
  total: number;
  /** Flag matches (only filled when `splitFlags` is on) and their full count. */
  flags: IconEntry[];
  flagTotal: number;
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
  const { query, source, limit = 24, searchDelayMs = 150, recordDelayMs = 700, splitFlags = false, flagLimit = 5 } = options;
  const recordSearch = useRecentsStore((s) => s.recordSearch);

  const [results, setResults] = useState<IconEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [flags, setFlags] = useState<IconEntry[]>([]);
  const [flagTotal, setFlagTotal] = useState(0);
  // The query the current `results` belong to. Loading is derived from this
  // (see below) rather than an effect-set flag, so a searchable query reads
  // as loading on the very first render, before the effect runs, instead
  // of flashing an empty state for one frame.
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [error, setError] = useState(false);

  // Track the last query we've recorded so we don't double-fire analytics
  // on re-renders that don't change the input.
  const lastRecordedRef = useRef<string>("");
  // Latest resolved match count, keyed by query, so the debounced recorder
  // below can attach an accurate result_count without re-running the search.
  const resolvedRef = useRef<{ query: string; total: number }>({ query: "", total: 0 });

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;
  const isLoading = hasQuery && resolvedQuery !== trimmed;
  // Never expose results/total belonging to a stale query: without this, a
  // click (or in the header, a keyboard select) during the debounce window
  // could act on the previous query's results while isLoading is still true.
  const effectiveResults = isLoading ? [] : results;
  const effectiveTotal = isLoading ? 0 : total;
  const effectiveFlags = isLoading ? [] : flags;
  const effectiveFlagTotal = isLoading ? 0 : flagTotal;

  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      setTotal(0);
      setFlags([]);
      setFlagTotal(0);
      return;
    }
    let active = true;
    setError(false);
    // Debounce the Fuse scan; `isLoading` is already true (derived) so the
    // dropdown shows a loading state across the wait, not a false empty state.
    const id = window.setTimeout(() => {
      Promise.all([loadIconsManifest(), import("@/lib/search")])
        .then(([icons, { searchIcons }]) => {
          if (!active) return;
          const all = searchIcons(icons, trimmed);
          const flagHits = splitFlags ? all.filter((i) => i.collection === "flags") : [];
          const main = splitFlags ? all.filter((i) => i.collection !== "flags") : all;
          setResults(main.slice(0, limit));
          setTotal(main.length);
          setFlags(flagHits.slice(0, flagLimit));
          setFlagTotal(flagHits.length);
          setResolvedQuery(trimmed);
          resolvedRef.current = { query: trimmed, total: all.length };
        })
        .catch(() => {
          if (!active) return;
          setError(true);
          setResults([]);
          setTotal(0);
          setResolvedQuery(trimmed);
        });
    }, searchDelayMs);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [trimmed, hasQuery, limit, searchDelayMs, splitFlags, flagLimit]);

  // Debounced recents + analytics recording. Mirrors `<Header>` so the
  // mobile sheet doesn't quietly skip writes. Attaches result_count when the
  // search has resolved for this query, so zero-result searches are visible
  // in the data instead of being silently indistinguishable from noise.
  useEffect(() => {
    if (!hasQuery) return;
    if (lastRecordedRef.current === trimmed) return;
    const id = window.setTimeout(() => {
      lastRecordedRef.current = trimmed;
      recordSearch(trimmed);
      const props: Record<string, unknown> = {
        query: trimmed,
        query_length: trimmed.length,
        source,
      };
      if (resolvedRef.current.query === trimmed) {
        props.result_count = resolvedRef.current.total;
      }
      posthog.capture("icon_searched", props);
      gaSearch(trimmed);
    }, recordDelayMs);
    return () => window.clearTimeout(id);
  }, [trimmed, hasQuery, recordSearch, source, recordDelayMs]);

  return { results: effectiveResults, total: effectiveTotal, flags: effectiveFlags, flagTotal: effectiveFlagTotal, isLoading, error };
}
