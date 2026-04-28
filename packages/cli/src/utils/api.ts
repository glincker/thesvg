// Registry API client - fetches the static manifest and filters client-side.
// thesvg ships as a static site; there is no dynamic API.

const BASE_URL = "https://thesvg.org";
const REGISTRY_PATH = "/api/registry.json";

export interface IconVariants {
  default: string;
  light?: string;
  dark?: string;
  mono?: string;
  wordmark?: string;
  wordmarkLight?: string;
  wordmarkDark?: string;
}

export interface IconEntry {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: IconVariants;
  license: string;
  url?: string;
  guidelines?: string;
}

export interface IconListResponse {
  total: number;
  offset: number;
  limit: number;
  icons: IconEntry[];
}

interface RegistryIcon {
  slug: string;
  title: string;
  aliases: string[];
  categories: string[];
  hex: string;
  url: string | null;
  variants: string[];
}

interface RegistryDocument {
  total: number;
  icons: RegistryIcon[];
}

function isRegistryIcon(value: unknown): value is RegistryIcon {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["slug"] === "string" &&
    typeof v["title"] === "string" &&
    Array.isArray(v["aliases"]) &&
    Array.isArray(v["categories"]) &&
    typeof v["hex"] === "string" &&
    Array.isArray(v["variants"])
  );
}

function isRegistryDocument(value: unknown): value is RegistryDocument {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["total"] === "number" &&
    Array.isArray(v["icons"]) &&
    v["icons"].every(isRegistryIcon)
  );
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let cachedRegistry: RegistryDocument | null = null;

async function fetchRegistry(): Promise<RegistryDocument> {
  if (cachedRegistry) return cachedRegistry;

  const url = `${BASE_URL}${REGISTRY_PATH}`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    throw new ApiError(`Network error fetching ${url}: ${message}`);
  }

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch registry: HTTP ${response.status}`,
      response.status
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(`Invalid JSON response from ${url}`);
  }

  if (!isRegistryDocument(json)) {
    throw new ApiError("Unexpected registry shape");
  }

  cachedRegistry = json;
  return json;
}

function variantsArrayToObject(slug: string, variants: string[]): IconVariants {
  const result: Record<string, string> = {
    default: `/icons/${slug}/default.svg`,
  };
  for (const variant of variants) {
    if (variant === "default") continue;
    const filename = variant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    result[variant] = `/icons/${slug}/${filename}.svg`;
  }
  return result as unknown as IconVariants;
}

function toIconEntry(icon: RegistryIcon): IconEntry {
  const entry: IconEntry = {
    slug: icon.slug,
    title: icon.title,
    aliases: icon.aliases,
    hex: icon.hex,
    categories: icon.categories,
    variants: variantsArrayToObject(icon.slug, icon.variants),
    license: "See registry",
  };
  if (icon.url) entry.url = icon.url;
  return entry;
}

/**
 * Fetch a single icon by slug from the registry.
 */
export async function fetchIcon(slug: string): Promise<IconEntry> {
  const registry = await fetchRegistry();
  const found = registry.icons.find((i) => i.slug === slug);
  if (!found) {
    throw new ApiError(`Not found: ${slug}`, 404);
  }
  return toIconEntry(found);
}

/**
 * Fetch the full icon list, optionally filtered by category.
 */
export async function fetchIconList(options?: {
  category?: string;
  query?: string;
  limit?: number;
}): Promise<IconListResponse> {
  const registry = await fetchRegistry();
  let icons = registry.icons;

  if (options?.category) {
    const wanted = options.category.toLowerCase();
    icons = icons.filter((i) =>
      i.categories.some((c) => c.toLowerCase() === wanted)
    );
  }

  if (options?.query) {
    const q = options.query.toLowerCase();
    icons = icons.filter((i) => {
      if (i.slug.toLowerCase().includes(q)) return true;
      if (i.title.toLowerCase().includes(q)) return true;
      return i.aliases.some((a) => a.toLowerCase().includes(q));
    });
  }

  const total = icons.length;
  const limit = options?.limit;
  const limited = limit !== undefined ? icons.slice(0, limit) : icons;

  return {
    total,
    offset: 0,
    limit: limit ?? total,
    icons: limited.map(toIconEntry),
  };
}

/**
 * Fetch the raw SVG content for a given icon + variant from the CDN.
 */
export async function fetchSvgContent(
  slug: string,
  variant: string = "default"
): Promise<string> {
  const filename = variantToFilename(variant);
  const url = `${BASE_URL}/icons/${encodeURIComponent(slug)}/${filename}.svg`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    throw new ApiError(`Network error fetching SVG from ${url}: ${message}`);
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(
        `SVG not found for "${slug}" (variant: ${variant})`,
        404
      );
    }
    throw new ApiError(
      `Failed to fetch SVG: HTTP ${response.status}`,
      response.status
    );
  }

  return response.text();
}

function variantToFilename(variant: string): string {
  return variant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
