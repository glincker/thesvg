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

async function fetchManifest(): Promise<IconEntry[]> {
  const res = await fetch("/api/icons-full.json");
  if (res.ok) {
    return res.json() as Promise<IconEntry[]>;
  }

  // Dev fallback: `pnpm dev` doesn't run generate-api.ts, so /api/icons-full.json
  // may 404. Fall back to the source-of-truth manifest at build-time only.
  if (process.env.NODE_ENV !== "production") {
    const mod = await import("@/data/icons.json");
    return mod.default as IconEntry[];
  }

  throw new Error(`Failed to load icons manifest: ${res.status}`);
}

export async function loadIconsManifest(): Promise<IconEntry[]> {
  if (cachedIcons) return cachedIcons;

  if (!fetchPromise) {
    fetchPromise = fetchManifest()
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
