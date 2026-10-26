// theSVG Figma Plugin - Main thread (sandbox)
// All network requests happen here to avoid CORS issues in the iframe.
// Data and SVGs are served from jsDelivr (CDN) rather than thesvg.org so
// the plugin keeps working even if the website is down or rate-limited.

const CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main";
const ICONS_JSON_URL = `${CDN_BASE}/src/data/icons.json`;
// UI icons live in a separate index and are never merged into the brand catalog.
const UI_INDEX_URL = `${CDN_BASE}/src/data/ui-icons.json`;
const ICONS_PATH_PREFIX = `${CDN_BASE}/public`;
const RECENTS_KEY = "thesvg.recents";
const RECENTS_LIMIT = 12;

interface SearchMessage {
  type: "search";
  query: string;
  category: string;
}

interface InsertMessage {
  type: "insert";
  slug: string;
  name: string;
  variant?: string;
}

interface LoadCategoriesMessage {
  type: "load-categories";
}

interface LoadRecentsMessage {
  type: "load-recents";
}

interface ClearRecentsMessage {
  type: "clear-recents";
}

interface UiLoadIndexMessage {
  type: "ui-load-index";
}

interface UiLoadSvgsMessage {
  type: "ui-load-svgs";
  look: string;
  slugs: string[];
}

interface UiInsertMessage {
  type: "ui-insert";
  slug: string;
  name: string;
  look: string;
  color: string;
}

interface CloseMessage {
  type: "close";
}

type PluginMessage =
  | SearchMessage
  | InsertMessage
  | LoadCategoriesMessage
  | LoadRecentsMessage
  | ClearRecentsMessage
  | UiLoadIndexMessage
  | UiLoadSvgsMessage
  | UiInsertMessage
  | CloseMessage;

figma.showUI(__html__, {
  width: 380,
  height: 560,
  themeColors: true,
  title: "theSVG",
});

interface RawIcon {
  slug: string;
  title: string;
  aliases?: string[];
  hex: string;
  categories: string[];
  variants: Record<string, string>;
  license: string;
  url?: string | null;
  collection?: string;
}

interface PluginIcon {
  slug: string;
  title: string;
  aliases: string[];
  categories: string[];
  hex: string;
  url: string | null;
  license: string;
  variants: string[];
  variantPaths: Record<string, string>;
}

interface RecentEntry {
  slug: string;
  title: string;
  variant: string;
  at: number;
}

let cachedCatalog: PluginIcon[] | null = null;
let cachedCategories: Array<{ name: string; count: number }> | null = null;

async function loadCatalog(): Promise<PluginIcon[]> {
  if (cachedCatalog) return cachedCatalog;
  const res = await fetch(ICONS_JSON_URL);
  if (!res.ok) throw new Error(`CDN error: ${res.status}`);
  const raw = (await res.json()) as RawIcon[];
  cachedCatalog = raw.map((i) => ({
    slug: i.slug,
    title: i.title,
    aliases: i.aliases || [],
    categories: i.categories || [],
    hex: i.hex,
    url: i.url || null,
    license: i.license,
    variants: Object.keys(i.variants || { default: "" }),
    variantPaths: i.variants || {},
  }));
  return cachedCatalog;
}

async function loadCategories() {
  if (cachedCategories) return cachedCategories;
  const catalog = await loadCatalog();
  const counts = new Map<string, number>();
  for (const icon of catalog) {
    for (const c of icon.categories) {
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }
  cachedCategories = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return cachedCategories;
}

async function searchIcons(query?: string, category?: string) {
  const catalog = await loadCatalog();
  let icons = catalog;

  if (category && category !== "all") {
    const wanted = category.toLowerCase();
    icons = icons.filter((i) =>
      i.categories.some((c) => c.toLowerCase() === wanted)
    );
  }

  if (query) {
    const q = query.toLowerCase();
    icons = icons.filter(
      (i) =>
        i.slug.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }

  return {
    total: icons.length,
    registryTotal: catalog.length,
    count: Math.min(icons.length, 100),
    limit: 100,
    icons: icons.slice(0, 100).map((i) => ({
      slug: i.slug,
      title: i.title,
      categories: i.categories,
      variants: i.variants,
      variantPaths: i.variantPaths,
    })),
  };
}

async function fetchWithRetry(url: string, retries = 1): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (attempt === retries) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      if (attempt === retries) throw err;
    }
  }
  throw new Error("unreachable");
}

async function getIconSvg(slug: string, variant: string): Promise<string> {
  const catalog = await loadCatalog();
  const icon = catalog.find((i) => i.slug === slug);
  if (!icon) throw new Error(`Unknown icon: ${slug}`);
  const relPath = icon.variantPaths[variant] || icon.variantPaths.default;
  if (!relPath) throw new Error(`No variant ${variant} for ${slug}`);
  const url = `${ICONS_PATH_PREFIX}${relPath}`;
  const res = await fetchWithRetry(url, 1);
  return res.text();
}

// ---- UI icons ----
interface UiIcon {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  set: string;
  releasedOn: string;
}

interface UiIndex {
  version: number;
  kind: string;
  looks: string[];
  files: string;
  sets: Array<{ id: string; name: string; releaseDate: string; count: number }>;
  icons: UiIcon[];
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
let cachedUiIndex: UiIndex | null = null;
const uiSvgCache = new Map<string, string>();

async function loadUiIndex(): Promise<UiIndex> {
  if (cachedUiIndex) return cachedUiIndex;
  const res = await fetch(UI_INDEX_URL);
  if (!res.ok) throw new Error(`CDN error: ${res.status}`);
  const raw = (await res.json()) as UiIndex;
  if (!raw || !Array.isArray(raw.icons) || !Array.isArray(raw.looks)) {
    throw new Error("Invalid UI icon index");
  }
  cachedUiIndex = raw;
  return raw;
}

async function getUiSvg(slug: string, look: string): Promise<string> {
  const index = await loadUiIndex();
  if (!index.looks.includes(look)) throw new Error(`Unknown look: ${look}`);
  if (!index.icons.some((i) => i.slug === slug)) {
    throw new Error(`Unknown icon: ${slug}`);
  }
  const key = `${slug}/${look}`;
  const hit = uiSvgCache.get(key);
  if (hit) return hit;
  const rel = index.files
    .replace("{slug}", encodeURIComponent(slug))
    .replace("{look}", encodeURIComponent(look));
  const res = await fetchWithRetry(`${ICONS_PATH_PREFIX}${rel}`, 1);
  const text = await res.text();
  uiSvgCache.set(key, text);
  return text;
}

async function loadRecents(): Promise<RecentEntry[]> {
  const raw = (await figma.clientStorage.getAsync(RECENTS_KEY)) as
    | RecentEntry[]
    | undefined;
  return Array.isArray(raw) ? raw : [];
}

async function pushRecent(entry: RecentEntry) {
  const current = await loadRecents();
  const dedup = current.filter(
    (e) => !(e.slug === entry.slug && e.variant === entry.variant)
  );
  dedup.unshift(entry);
  const trimmed = dedup.slice(0, RECENTS_LIMIT);
  await figma.clientStorage.setAsync(RECENTS_KEY, trimmed);
  return trimmed;
}

async function clearRecents() {
  await figma.clientStorage.setAsync(RECENTS_KEY, []);
  return [];
}

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === "search") {
    try {
      const result = await searchIcons(msg.query || undefined, msg.category);
      figma.ui.postMessage({ type: "search-results", data: result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      figma.ui.postMessage({ type: "search-error", error: message });
    }
  }

  if (msg.type === "insert") {
    const variant = msg.variant || "default";
    try {
      figma.ui.postMessage({
        type: "insert-status",
        slug: msg.slug,
        status: "loading",
      });

      const svg = await getIconSvg(msg.slug, variant);
      const node = figma.createNodeFromSvg(svg);
      node.name = variant === "default" ? msg.name : `${msg.name} (${variant})`;

      node.x = figma.viewport.center.x - node.width / 2;
      node.y = figma.viewport.center.y - node.height / 2;

      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);

      const recents = await pushRecent({
        slug: msg.slug,
        title: msg.name,
        variant,
        at: Date.now(),
      });

      figma.notify(`Inserted "${msg.name}"`);
      figma.ui.postMessage({
        type: "insert-status",
        slug: msg.slug,
        status: "done",
      });
      figma.ui.postMessage({ type: "recents", data: recents });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      figma.notify(`Failed to insert SVG: ${message}`, { error: true });
      figma.ui.postMessage({
        type: "insert-status",
        slug: msg.slug,
        status: "error",
      });
    }
  }

  if (msg.type === "ui-load-index") {
    try {
      const index = await loadUiIndex();
      figma.ui.postMessage({
        type: "ui-index",
        data: { looks: index.looks, icons: index.icons },
      });
    } catch {
      // Not published yet or offline: the UI hides the switch, brand mode is unaffected
      figma.ui.postMessage({ type: "ui-index-unavailable" });
    }
  }

  if (msg.type === "ui-load-svgs") {
    const items: Record<string, string> = {};
    // Failures are skipped so one bad file never blanks the whole grid
    await Promise.all(
      msg.slugs.map(async (slug) => {
        try {
          items[slug] = await getUiSvg(slug, msg.look);
        } catch {
          // leave the card without a preview
        }
      })
    );
    figma.ui.postMessage({ type: "ui-svgs", look: msg.look, items });
  }

  if (msg.type === "ui-insert") {
    try {
      figma.ui.postMessage({
        type: "insert-status",
        slug: msg.slug,
        status: "loading",
      });
      const color = HEX_COLOR.test(msg.color) ? msg.color : "#111111";
      // Figma does not resolve currentColor, so bake the chosen color in.
      const svg = (await getUiSvg(msg.slug, msg.look)).replace(
        /currentColor/g,
        color
      );
      const node = figma.createNodeFromSvg(svg);
      node.name = `${msg.name} (${msg.look})`;

      node.x = figma.viewport.center.x - node.width / 2;
      node.y = figma.viewport.center.y - node.height / 2;

      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);

      figma.notify(`Inserted "${msg.name}"`);
      figma.ui.postMessage({
        type: "insert-status",
        slug: msg.slug,
        status: "done",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      figma.notify(`Failed to insert SVG: ${message}`, { error: true });
      figma.ui.postMessage({
        type: "insert-status",
        slug: msg.slug,
        status: "error",
      });
    }
  }

  if (msg.type === "load-categories") {
    try {
      const categories = await loadCategories();
      figma.ui.postMessage({ type: "categories", data: categories });
    } catch {
      // Categories are optional, fail silently
    }
  }

  if (msg.type === "load-recents") {
    const recents = await loadRecents();
    figma.ui.postMessage({ type: "recents", data: recents });
  }

  if (msg.type === "clear-recents") {
    const empty = await clearRecents();
    figma.ui.postMessage({ type: "recents", data: empty });
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
