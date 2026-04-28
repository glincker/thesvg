// theSVG Figma Plugin - Main thread (sandbox)
// All network requests happen here to avoid CORS issues in the iframe

const API_BASE = "https://www.thesvg.org";

interface SearchMessage {
  type: "search";
  query: string;
  category: string;
}

interface InsertMessage {
  type: "insert";
  slug: string;
  name: string;
}

interface LoadCategoriesMessage {
  type: "load-categories";
}

type PluginMessage = SearchMessage | InsertMessage | LoadCategoriesMessage;

figma.showUI(__html__, {
  width: 380,
  height: 520,
  themeColors: true,
  title: "theSVG",
});

interface RegistryIcon {
  slug: string;
  title: string;
  aliases: string[];
  categories: string[];
  hex: string;
  url: string | null;
  license: string;
  variants: string[];
}

interface RegistryDocument {
  total: number;
  icons: RegistryIcon[];
}

let cachedRegistry: RegistryDocument | null = null;

async function loadRegistry(): Promise<RegistryDocument> {
  if (cachedRegistry) return cachedRegistry;
  const res = await fetch(API_BASE + "/api/registry.json");
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  cachedRegistry = (await res.json()) as RegistryDocument;
  return cachedRegistry;
}

async function searchIcons(query?: string, category?: string) {
  const registry = await loadRegistry();
  let icons = registry.icons;

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
    count: Math.min(icons.length, 100),
    limit: 100,
    icons: icons.slice(0, 100),
  };
}

async function getIconSvg(slug: string): Promise<string> {
  const url = `${API_BASE}/icons/${encodeURIComponent(slug)}/default.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch SVG: ${res.status}`);
  return res.text();
}

async function loadCategories() {
  const res = await fetch(`${API_BASE}/api/categories.json`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.categories;
}

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === "search") {
    try {
      const result = await searchIcons(
        msg.query || undefined,
        msg.category
      );
      figma.ui.postMessage({ type: "search-results", data: result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      figma.ui.postMessage({ type: "search-error", error: message });
    }
  }

  if (msg.type === "insert") {
    try {
      figma.ui.postMessage({
        type: "insert-status",
        slug: msg.slug,
        status: "loading",
      });

      const svg = await getIconSvg(msg.slug);
      const node = figma.createNodeFromSvg(svg);
      node.name = msg.name;

      // Center in viewport
      node.x = figma.viewport.center.x - node.width / 2;
      node.y = figma.viewport.center.y - node.height / 2;

      // Select and scroll to the new node
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
};
