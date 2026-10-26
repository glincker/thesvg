// UI icon data layer. Separate from the bundled brand index: the UI index is
// fetched lazily and cached, and a failure only ever surfaces to UI requests.

import Fuse from "fuse.js";

// UI data is not part of the pinned brand release, so it reads from main.
export const UI_CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main";
// The per-icon SVG files are build artifacts served by the site, not committed, so links point there.
export const UI_SITE_BASE = "https://thesvg.org";
export const UI_INDEX_URL = `${UI_CDN_BASE}/src/data/ui-icons.json`;
export const DEFAULT_LOOK = "outline";

const FETCH_TIMEOUT_MS = 10_000;

export interface UiIcon {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  set: string;
  releasedOn: string;
}

export interface UiIndex {
  version: number;
  kind: string;
  looks: string[];
  files: string;
  icons: UiIcon[];
}

export class UiUnavailableError extends Error {
  constructor(detail: string) {
    super(`UI icons are unavailable right now (${detail}). Brand icons are not affected.`);
    this.name = "UiUnavailableError";
  }
}

function isUiIndex(value: unknown): value is UiIndex {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v["looks"]) &&
    v["looks"].every((l) => typeof l === "string") &&
    Array.isArray(v["icons"]) &&
    v["icons"].every((i) => {
      if (typeof i !== "object" || i === null) return false;
      const r = i as Record<string, unknown>;
      return (
        typeof r["slug"] === "string" &&
        typeof r["title"] === "string" &&
        typeof r["category"] === "string" &&
        Array.isArray(r["tags"])
      );
    })
  );
}

let indexCache: UiIndex | null = null;
let fuseCache: Fuse<UiIcon> | null = null;

/** Test-only: drop cached UI state. */
export function resetUiCacheForTests(): void {
  indexCache = null;
  fuseCache = null;
}

/** Fetches the UI index once and caches it. Throws UiUnavailableError on any failure. */
export async function loadUiIndex(): Promise<UiIndex> {
  if (indexCache) return indexCache;

  let res: Response;
  try {
    res = await fetch(UI_INDEX_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    throw new UiUnavailableError(err instanceof Error ? err.message : String(err));
  }
  if (!res.ok) throw new UiUnavailableError(`HTTP ${res.status}`);

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new UiUnavailableError("invalid JSON");
  }
  if (!isUiIndex(json)) throw new UiUnavailableError("unexpected index shape");

  indexCache = json;
  return json;
}

export function buildUiUrl(slug: string, look: string): string {
  return `${UI_SITE_BASE}/ui/${encodeURIComponent(slug)}/${encodeURIComponent(look)}.svg`;
}

export async function searchUiIcons(query: string, limit = 20): Promise<UiIcon[]> {
  const index = await loadUiIndex();
  if (!fuseCache) {
    fuseCache = new Fuse(index.icons, {
      keys: [
        { name: "slug", weight: 0.4 },
        { name: "title", weight: 0.3 },
        { name: "tags", weight: 0.2 },
        { name: "category", weight: 0.1 },
      ],
      threshold: 0.35,
    });
  }
  return fuseCache.search(query, { limit }).map((r) => r.item);
}

export async function findUiIcon(slug: string): Promise<UiIcon | undefined> {
  return (await loadUiIndex()).icons.find((i) => i.slug === slug);
}

export async function listUiCategories(): Promise<{ name: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const icon of (await loadUiIndex()).icons) {
    counts.set(icon.category, (counts.get(icon.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

/** Returns an error message when the look is unknown, otherwise null. */
export function checkLook(index: UiIndex, look: string): string | null {
  return index.looks.includes(look)
    ? null
    : `Unknown look "${look}". Valid looks: ${index.looks.join(", ")}.`;
}
