## 2024-10-26 - Centralize Map caching for O(1) lookups
**Learning:** React components (like `header.tsx`, `recents-page.tsx`, etc) were independently instantiating identical `Map<string, IconEntry>` instances for the same 3,500+ items upon fetching the icon manifest, which added unnecessary O(N) overhead during initialization and memory pressure.
**Action:** Extract the cached internal Map from `src/lib/icons-manifest.ts` into a public `getIconsBySlugMap()` function and have consumers reuse it, preventing redundant processing.
