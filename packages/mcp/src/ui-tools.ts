// Tool handlers for kind "ui". Every handler converts failures into a tool
// error result, so a UI outage never throws into (or affects) brand tools.

import {
  buildUiUrl,
  checkLook,
  listUiCategories,
  loadUiIndex,
  searchUiIcons,
} from "./ui.js";

const FETCH_TIMEOUT_MS = 10_000;

export interface UiToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: true;
}

const text = (t: string): UiToolResult => ({ content: [{ type: "text", text: t }] });
const fail = (t: string): UiToolResult => ({
  content: [{ type: "text", text: t }],
  isError: true,
});

const notFound = (slug: string): UiToolResult =>
  fail(`UI icon not found: "${slug}". Use search_icons with kind "ui" to find the correct slug.`);

async function guard(run: () => Promise<UiToolResult>): Promise<UiToolResult> {
  try {
    return await run();
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}

export function uiSearch(query: string, limit: number): Promise<UiToolResult> {
  return guard(async () => {
    const results = await searchUiIcons(query, limit);
    if (results.length === 0) return text(`No UI icons found matching "${query}".`);
    return text(
      [
        `Found ${results.length} UI icon${results.length === 1 ? "" : "s"} for "${query}":`,
        "",
        ...results.map(
          (i) =>
            `- **${i.title}** (slug: \`${i.slug}\`) | category: ${i.category} | tags: ${i.tags.join(", ")}`
        ),
      ].join("\n")
    );
  });
}

export function uiGet(slug: string, look: string): Promise<UiToolResult> {
  return guard(async () => {
    const index = await loadUiIndex();
    const bad = checkLook(index, look);
    if (bad) return fail(bad);
    const icon = index.icons.find((i) => i.slug === slug);
    if (!icon) return notFound(slug);

    const url = buildUiUrl(slug, look);
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      return fail(`Could not fetch SVG for UI icon "${slug}" look "${look}" (${res.status}).`);
    }
    const svg = await res.text();

    return text(
      [
        `# ${icon.title}`,
        "",
        `**Slug**: \`${icon.slug}\``,
        `**Look**: ${look}`,
        `**CDN URL**: ${url}`,
        `**Category**: ${icon.category}`,
        `**Available looks**: ${index.looks.join(", ")}`,
        "",
        "```svg",
        svg,
        "```",
      ].join("\n")
    );
  });
}

export function uiUrl(slug: string, look: string): Promise<UiToolResult> {
  return guard(async () => {
    const index = await loadUiIndex();
    const bad = checkLook(index, look);
    if (bad) return fail(bad);
    const icon = index.icons.find((i) => i.slug === slug);
    if (!icon) return notFound(slug);
    const url = buildUiUrl(slug, look);
    return text(
      [
        `**CDN URL** for UI icon \`${slug}\` (look: ${look}):`,
        "",
        url,
        "",
        "```html",
        `<img src="${url}" alt="${icon.title}" width="24" height="24" />`,
        "```",
      ].join("\n")
    );
  });
}

export function uiLooks(slug: string): Promise<UiToolResult> {
  return guard(async () => {
    const index = await loadUiIndex();
    const icon = index.icons.find((i) => i.slug === slug);
    if (!icon) return notFound(slug);
    return text(
      [
        `**${icon.title}** (\`${icon.slug}\`) has ${index.looks.length} looks:`,
        "",
        ...index.looks.map((l) => `- \`${l}\` -- ${buildUiUrl(slug, l)}`),
      ].join("\n")
    );
  });
}

export function uiCategories(): Promise<UiToolResult> {
  return guard(async () => {
    const cats = await listUiCategories();
    const total = (await loadUiIndex()).icons.length;
    if (cats.length === 0) return text("No categories found.");
    return text(
      [
        `${cats.length} categories across ${total} UI icons:`,
        "",
        ...cats.map((c) => `- **${c.name}** - ${c.count} icon${c.count === 1 ? "" : "s"}`),
      ].join("\n")
    );
  });
}
