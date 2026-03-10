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

async function searchIcons(query?: string, category?: string) {
  const parts: string[] = [];
  if (query) parts.push("q=" + encodeURIComponent(query));
  if (category && category !== "all") parts.push("category=" + encodeURIComponent(category));
  parts.push("limit=100");

  const res = await fetch(API_BASE + "/api/registry?" + parts.join("&"));
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function getIconSvg(slug: string): Promise<string> {
  const res = await fetch(
    `${API_BASE}/api/registry/${encodeURIComponent(slug)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

  const data = await res.json();
  const variant = data.variants["default"];

  if (!variant || !variant.svg) {
    throw new Error("SVG not available");
  }

  return variant.svg;
}

async function loadCategories() {
  const res = await fetch(`${API_BASE}/api/categories`);
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
