import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tracks the user's recent activity on the site — kept entirely in
 * localStorage (no backend, no analytics). Powers personalization
 * surfaces like "recent searches" chips, "pick up where you left off"
 * rails, and "updated since you last visited" badges.
 *
 * Capped to MAX_ENTRIES per list so the localStorage payload stays
 * small (~few KB max). Each entry tracks `ts` so consumers can show
 * relative time or expire stale items.
 */

const MAX_RECENT_VIEWED = 20;
const MAX_RECENT_COPIED = 20;
const MAX_RECENT_SEARCHED = 10;

/**
 * Hard cap on stored search query length. Defensive: prevents a tampered
 * or pasted novella from bloating localStorage and breaking dropdown layout.
 * Real searches are <40 chars; 100 is a generous ceiling.
 */
const MAX_QUERY_LENGTH = 100;

/**
 * Hard cap on stored slug length. Slugs in our manifest are <80 chars;
 * 120 catches future namespacing (`collection-subcategory-name`) without
 * accepting unbounded input from tampered storage.
 */
const MAX_SLUG_LENGTH = 120;

export interface RecentViewed {
  slug: string;
  ts: number;
}

export interface RecentCopied {
  slug: string;
  format: "svg" | "jsx" | "vue" | "png" | "data-uri" | "cdn" | "hex";
  ts: number;
  count: number;
}

export interface RecentSearched {
  query: string;
  ts: number;
}

interface RecentsState {
  viewed: RecentViewed[];
  copied: RecentCopied[];
  searched: RecentSearched[];

  recordView: (slug: string) => void;
  recordCopy: (slug: string, format: RecentCopied["format"]) => void;
  recordSearch: (query: string) => void;

  clearViewed: () => void;
  clearCopied: () => void;
  clearSearched: () => void;
  clearAll: () => void;
}

function pushUnique<T extends { ts: number }>(
  list: T[],
  next: T,
  match: (a: T, b: T) => boolean,
  max: number,
): T[] {
  const filtered = list.filter((item) => !match(item, next));
  return [next, ...filtered].slice(0, max);
}

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set) => ({
      viewed: [],
      copied: [],
      searched: [],

      recordView: (slug) => {
        if (typeof slug !== "string" || slug.length === 0) return;
        const safe = slug.slice(0, MAX_SLUG_LENGTH);
        set((s) => ({
          viewed: pushUnique(
            s.viewed,
            { slug: safe, ts: Date.now() },
            (a, b) => a.slug === b.slug,
            MAX_RECENT_VIEWED,
          ),
        }));
      },

      recordCopy: (slug, format) => {
        if (typeof slug !== "string" || slug.length === 0) return;
        const safe = slug.slice(0, MAX_SLUG_LENGTH);
        set((s) => {
          const existing = s.copied.find(
            (c) => c.slug === safe && c.format === format,
          );
          const next: RecentCopied = {
            slug: safe,
            format,
            ts: Date.now(),
            count: (existing?.count ?? 0) + 1,
          };
          return {
            copied: pushUnique(
              s.copied,
              next,
              (a, b) => a.slug === b.slug && a.format === b.format,
              MAX_RECENT_COPIED,
            ),
          };
        });
      },

      recordSearch: (query) => {
        if (typeof query !== "string") return;
        const q = query.trim().slice(0, MAX_QUERY_LENGTH);
        if (q.length < 2) return; // ignore single-char noise
        set((s) => ({
          searched: pushUnique(
            s.searched,
            { query: q, ts: Date.now() },
            (a, b) => a.query.toLowerCase() === b.query.toLowerCase(),
            MAX_RECENT_SEARCHED,
          ),
        }));
      },

      clearViewed: () => set({ viewed: [] }),
      clearCopied: () => set({ copied: [] }),
      clearSearched: () => set({ searched: [] }),
      clearAll: () => set({ viewed: [], copied: [], searched: [] }),
    }),
    { name: "thesvg-recents" },
  ),
);
