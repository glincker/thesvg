const BASE_URL = "https://thesvg.org";
// Single source for jsDelivr-hosted data, brand SVG CDN links and UI icon data.
const CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main";

export interface Preferences {
  defaultVariant: string;
}

export interface IconEntry {
  slug: string;
  title: string;
  aliases: string[];
  categories: string[];
  hex: string;
  url: string | null;
  variants: string[];
}

export interface IconDetail {
  slug: string;
  title: string;
  aliases: string[];
  categories: string[];
  hex: string;
  url: string | null;
  variants: Record<string, { url: string; svg: string }>;
  cdn: {
    jsdelivr: string;
    direct: string;
  };
}

interface RegistryResponse {
  total: number;
  icons: IconEntry[];
}

export interface SearchResult {
  total: number;
  icons: IconEntry[];
}

export interface Category {
  name: string;
  count: number;
}

let cachedRegistry: RegistryResponse | null = null;

async function fetchRegistry(): Promise<RegistryResponse> {
  if (cachedRegistry) return cachedRegistry;
  const res = await fetch(`${BASE_URL}/api/registry.json`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  cachedRegistry = (await res.json()) as RegistryResponse;
  return cachedRegistry;
}

export async function searchIcons(
  query?: string,
  category?: string,
  limit = 50,
): Promise<SearchResult> {
  const data = await fetchRegistry();
  let filtered = data.icons;

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (icon) =>
        icon.title.toLowerCase().includes(q) ||
        icon.slug.toLowerCase().includes(q) ||
        icon.aliases.some((a) => a.toLowerCase().includes(q)) ||
        icon.categories.some((c) => c.toLowerCase().includes(q)),
    );
  }

  if (category && category !== "all") {
    const cat = category.toLowerCase();
    filtered = filtered.filter((icon) =>
      icon.categories.some((c) => c.toLowerCase() === cat),
    );
  }

  return {
    total: data.total,
    icons: filtered.slice(0, limit),
  };
}

async function fetchSvg(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) return "";
  return res.text();
}

export async function getIcon(slug: string): Promise<IconDetail> {
  const data = await fetchRegistry();
  const entry = data.icons.find((i) => i.slug === slug);
  if (!entry) throw new Error(`Icon not found: ${slug}`);

  // Fetch SVG content for all variants in parallel
  const variantEntries = await Promise.all(
    entry.variants.map(async (v) => {
      const url = getIconUrl(slug, v);
      const svg = await fetchSvg(url);
      return [v, { url, svg }] as const;
    }),
  );

  return {
    slug: entry.slug,
    title: entry.title,
    aliases: entry.aliases,
    categories: entry.categories,
    hex: entry.hex,
    url: entry.url,
    variants: Object.fromEntries(variantEntries),
    cdn: {
      jsdelivr: getCdnUrl(slug),
      direct: getIconUrl(slug),
    },
  };
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/api/categories.json`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = (await res.json()) as { categories: Category[] };
  return data.categories;
}

export function getIconUrl(slug: string, variant = "default"): string {
  return `${BASE_URL}/icons/${slug}/${variant}.svg`;
}

export function getIconPageUrl(slug: string): string {
  return `${BASE_URL}/icon/${slug}`;
}

export function getCdnUrl(slug: string, variant = "default"): string {
  return `${CDN_BASE}/public/icons/${slug}/${variant}.svg`;
}

// --- Copy format helpers ---

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

function svgToJsxAttrs(svg: string): string {
  return svg
    .replace(/\bclass="/g, 'className="')
    .replace(/\bxmlns="[^"]*"/g, "")
    .replace(
      /\b([a-z]+)-([a-z])/g,
      (_, a: string, b: string) => `${a}${b.toUpperCase()}`,
    );
}

export function toJsx(svg: string, componentName: string): string {
  const name = toPascalCase(componentName);
  const jsxSvg = svgToJsxAttrs(svg);
  return `export function ${name}Icon(props) {\n  return (\n    ${jsxSvg.replace(/<svg/, "<svg {...props}")}\n  );\n}`;
}

export function toHtmlImg(slug: string, title: string): string {
  const url = getIconUrl(slug);
  return `<img src="${url}" alt="${title}" width="24" height="24" />`;
}

export function toDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml,${encoded}`;
}

// --- UI icons (separate index, never merged into brand data) ---

export const UI_LOOKS = [
  "outline",
  "glass",
  "duotone",
  "offset",
  "fill",
  "pixel",
  "depth",
] as const;

export type UiLook = (typeof UI_LOOKS)[number];

export interface UiIconEntry {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  set: string;
  releasedOn: string;
}

interface UiIndex {
  version: number;
  kind: "ui";
  looks: string[];
  icons: UiIconEntry[];
}

export interface UiSearchResult {
  total: number;
  icons: UiIconEntry[];
}

let uiIndexPromise: Promise<UiIndex | null> | null = null;

// Fails soft: the data may not be published yet, so callers get null, not an error.
async function fetchUiIndex(): Promise<UiIndex | null> {
  if (!uiIndexPromise) {
    uiIndexPromise = (async () => {
      try {
        const res = await fetch(`${CDN_BASE}/src/data/ui-icons.json`);
        if (!res.ok) return null;
        const data = (await res.json()) as UiIndex;
        return Array.isArray(data.icons) ? data : null;
      } catch {
        return null;
      }
    })().then((index) => {
      // Do not remember a failure, so a later search can retry.
      if (!index) uiIndexPromise = null;
      return index;
    });
  }
  return uiIndexPromise;
}

export async function searchUiIcons(
  query?: string,
  limit = 50,
): Promise<UiSearchResult> {
  const index = await fetchUiIndex();
  if (!index) return { total: 0, icons: [] };

  let filtered = index.icons;
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (icon) =>
        icon.title.toLowerCase().includes(q) ||
        icon.slug.toLowerCase().includes(q) ||
        icon.category.toLowerCase().includes(q) ||
        icon.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  return { total: index.icons.length, icons: filtered.slice(0, limit) };
}

export function getUiIconUrl(slug: string, look: UiLook = "outline"): string {
  return `${CDN_BASE}/public/ui/${slug}/${look}.svg`;
}

export function getUiIconPageUrl(slug: string): string {
  return `${BASE_URL}/ui/${slug}`;
}

// Returns the raw SVG with currentColor intact so copies stay themeable.
export async function getUiSvg(slug: string, look: UiLook): Promise<string> {
  const svg = await fetchSvg(getUiIconUrl(slug, look));
  if (!svg) throw new Error("SVG not available");
  return svg;
}

// Previews have no CSS context, so swap currentColor for a fixed readable color.
export function toPreviewDataUri(svg: string, color: string): string {
  return toDataUri(svg.replace(/currentColor/g, color));
}

export function toUiHtmlImg(slug: string, title: string, look: UiLook): string {
  return `<img src="${getUiIconUrl(slug, look)}" alt="${title}" width="24" height="24" />`;
}
