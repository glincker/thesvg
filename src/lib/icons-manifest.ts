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

export async function loadIconsManifest(): Promise<IconEntry[]> {
  if (cachedIcons) return cachedIcons;

  if (!fetchPromise) {
    fetchPromise = fetch("/api/icons-full.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load icons manifest: ${res.status}`);
        return res.json() as Promise<IconEntry[]>;
      })
      .then((data) => {
        cachedIcons = data;
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
