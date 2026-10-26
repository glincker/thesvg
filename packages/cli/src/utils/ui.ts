// UI icon client. Kept apart from the brand registry so a UI fetch failure
// can never touch brand calls. The index loads lazily and is cached in memory.

import { ApiError } from "./api.js";

// UI data is not part of the pinned brand registry, so it reads from the CDN.
export const UI_BASE_URL = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main";
const UI_INDEX_PATH = "/src/data/ui-icons.json";

export const DEFAULT_LOOK = "outline";
export const UI_PREFIX = "ui:";

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

function isUiIcon(value: unknown): value is UiIcon {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["slug"] === "string" &&
    typeof v["title"] === "string" &&
    typeof v["category"] === "string" &&
    Array.isArray(v["tags"])
  );
}

function isUiIndex(value: unknown): value is UiIndex {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v["looks"]) &&
    v["looks"].every((l) => typeof l === "string") &&
    Array.isArray(v["icons"]) &&
    v["icons"].every(isUiIcon)
  );
}

let cachedIndex: UiIndex | null = null;

export function __resetCachedUiIndexForTest(): void {
  cachedIndex = null;
}

export async function fetchUiIndex(): Promise<UiIndex> {
  if (cachedIndex) return cachedIndex;

  const url = `${UI_BASE_URL}${UI_INDEX_PATH}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    throw new ApiError(`UI icons are unavailable (network error: ${message})`);
  }

  if (!response.ok) {
    throw new ApiError(
      `UI icons are unavailable (HTTP ${response.status})`,
      response.status
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError("UI icons are unavailable (invalid JSON)");
  }

  if (!isUiIndex(json)) {
    throw new ApiError("UI icons are unavailable (unexpected index shape)");
  }

  cachedIndex = json;
  return json;
}

export function stripUiPrefix(arg: string): string | null {
  return arg.startsWith(UI_PREFIX) ? arg.slice(UI_PREFIX.length) : null;
}

export async function fetchUiIconList(options?: {
  category?: string;
  query?: string;
  limit?: number;
}): Promise<{ total: number; icons: UiIcon[] }> {
  const index = await fetchUiIndex();
  let icons = index.icons;

  if (options?.category) {
    const wanted = options.category.toLowerCase();
    icons = icons.filter((i) => i.category.toLowerCase() === wanted);
  }

  if (options?.query) {
    const words = options.query.toLowerCase().split(/\s+/).filter(Boolean);
    icons = icons.filter((i) => {
      const hay = [i.slug, i.title, i.category, ...i.tags].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }

  const total = icons.length;
  const limit = options?.limit;
  return { total, icons: limit !== undefined ? icons.slice(0, limit) : icons };
}

/** Throws ApiError listing valid looks when the look is unknown. */
export async function assertValidLook(look: string): Promise<void> {
  const index = await fetchUiIndex();
  if (!index.looks.includes(look)) {
    throw new ApiError(
      `Unknown look "${look}". Valid looks: ${index.looks.join(", ")}`
    );
  }
}

export async function fetchUiIcon(slug: string): Promise<UiIcon> {
  const index = await fetchUiIndex();
  const found = index.icons.find((i) => i.slug === slug);
  if (!found) throw new ApiError(`UI icon not found: ${slug}`, 404);
  return found;
}

export async function fetchUiSvgContent(
  slug: string,
  look: string = DEFAULT_LOOK
): Promise<string> {
  const url = `${UI_BASE_URL}/public/ui/${encodeURIComponent(slug)}/${encodeURIComponent(look)}.svg`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    throw new ApiError(`Network error fetching SVG from ${url}: ${message}`);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status === 404
        ? `SVG not found for UI icon "${slug}" (look: ${look})`
        : `Failed to fetch SVG: HTTP ${response.status}`,
      response.status
    );
  }

  return response.text();
}
