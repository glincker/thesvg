/**
 * Background service worker.
 * Handles registry fetch and caching with a 24-hour TTL.
 *
 * TODO (v1.1): add context menu integration
 * TODO (v1.1): push registry refresh notification to popup via chrome.runtime.sendMessage
 */

export default defineBackground(() => {
  const REGISTRY_URL =
    "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json";
  const CACHE_KEY = "registry_cache";
  const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  interface CacheEntry {
    timestamp: number;
    data: RegistryResponse;
  }

  interface IconEntry {
    slug: string;
    title: string;
    aliases: string[];
    hex: string;
    categories: string[];
    variants: string[];
    url: string | null;
  }

  interface RegistryResponse {
    total: number;
    icons: IconEntry[];
  }

  async function fetchAndCacheRegistry(): Promise<void> {
    try {
      const stored = await chrome.storage.local.get(CACHE_KEY);
      const entry = stored[CACHE_KEY] as CacheEntry | undefined;

      if (entry && Date.now() - entry.timestamp < TTL_MS) {
        // Cache still valid, nothing to do
        return;
      }

      const response = await fetch(REGISTRY_URL);
      if (!response.ok) {
        throw new Error(`Registry fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as RegistryResponse;
      const cacheEntry: CacheEntry = {
        timestamp: Date.now(),
        data,
      };

      await chrome.storage.local.set({ [CACHE_KEY]: cacheEntry });
    } catch (err) {
      console.error("[theSVG background] Registry fetch error:", err);
    }
  }

  // Fetch registry on install and on startup
  chrome.runtime.onInstalled.addListener(() => {
    fetchAndCacheRegistry();
  });

  chrome.runtime.onStartup.addListener(() => {
    fetchAndCacheRegistry();
  });

  // Handle messages from popup requesting registry data
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_REGISTRY") {
      chrome.storage.local
        .get(CACHE_KEY)
        .then((stored) => {
          const entry = stored[CACHE_KEY] as CacheEntry | undefined;
          if (entry) {
            sendResponse({ success: true, data: entry.data, cached: true });
            return;
          }
          // Fetch fresh if not cached
          fetch(REGISTRY_URL)
            .then((r) => r.json())
            .then((data: RegistryResponse) => {
              const cacheEntry: CacheEntry = {
                timestamp: Date.now(),
                data,
              };
              chrome.storage.local.set({ [CACHE_KEY]: cacheEntry });
              sendResponse({ success: true, data, cached: false });
            })
            .catch((err: unknown) => {
              sendResponse({
                success: false,
                error: err instanceof Error ? err.message : "Unknown error",
              });
            });
        })
        .catch((err: unknown) => {
          // chrome.storage.local.get itself can reject (corrupt storage,
          // quota errors). Close the response channel cleanly so the popup
          // does not hang.
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : "Storage unavailable",
          });
        });

      // Return true to indicate async response
      return true;
    }
  });
});
