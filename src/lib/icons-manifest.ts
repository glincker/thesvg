/**
 * Client-side lazy loader for the full icons manifest.
 *
 * Instead of serializing the 2.5 MB icons array into the initial HTML payload,
 * the server passes only lightweight props (recentIcons, categoryCounts, collections).
 * The full manifest is fetched from /api/icons-full.json only when the user
 * searches or filters (i.e., leaves the hero/default view).
 */

import type { IconEntry } from "@/lib/icons";

let cachedIcons: IconEntry[] | null = null;
let fetchPromise: Promise<IconEntry[]> | null = null;
let iconsBySlugCache: Map<string, IconEntry> | null = null;

// A browser never rejects a stalled fetch on its own, so without a deadline the
// manifest load can hang forever and the caller's error state never shows. Abort
// each attempt after its deadline. The retry gets a shorter deadline so a
// transient stall still recovers while a persistent one fails fast.
const FETCH_TIMEOUT_MS = 20000;
const RETRY_TIMEOUT_MS = 10000;

async function fetchManifestOnce(timeoutMs: number): Promise<IconEntry[]> {
  const controller = new AbortController();
  // The timer covers both the response headers and the body download, because
  // the abort signal cancels the whole request until json() resolves.
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/icons-full.json", { signal: controller.signal });
    if (res.ok) {
      return (await res.json()) as IconEntry[];
    }

    // Dev fallback: `pnpm dev` doesn't run generate-api.ts, so /api/icons-full.json
    // may 404. Fall back to the source-of-truth manifest at build-time only.
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/data/icons.json");
      return mod.default as IconEntry[];
    }

    throw new Error(`Failed to load icons manifest: ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchManifest(): Promise<IconEntry[]> {
  try {
    return await fetchManifestOnce(FETCH_TIMEOUT_MS);
  } catch {
    return await fetchManifestOnce(RETRY_TIMEOUT_MS);
  }
}

export async function loadIconsManifest(): Promise<IconEntry[]> {
  if (cachedIcons) return cachedIcons;

  if (!fetchPromise) {
    fetchPromise = fetchManifest()
      .then((data) => {
        cachedIcons = data;

        // ⚡ Bolt: Build an O(1) slug lookup map when the manifest loads
        // to avoid expensive .find() calls on a 7,400+ item array
        const map = new Map<string, IconEntry>();
        for (let i = 0; i < data.length; i++) {
          map.set(data[i].slug, data[i]);
        }
        iconsBySlugCache = map;

        return data;
      })
      .catch((err) => {
        // Reset so next attempt can retry
        fetchPromise = null;
        throw err;
      });
  }

  return fetchPromise;
}

export function getIconBySlugFromManifest(slug: string): IconEntry | null {
  if (!iconsBySlugCache) return null;
  return iconsBySlugCache.get(slug) ?? null;
}

/**
 * Prefetch the manifest without blocking. Call this to warm the cache
 * when idle (e.g. after the hero renders).
 */
export function prefetchIconsManifest(): void {
  if (cachedIcons || fetchPromise) return;
  loadIconsManifest().catch(() => {
    // Silently ignore prefetch failures
  });
}
