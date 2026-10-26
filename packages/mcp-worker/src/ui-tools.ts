// Handlers for kind "ui". Each one turns any failure into an error result,
// so a UI outage never throws into (or affects) the brand tools.

import {
  buildUiUrl,
  checkLook,
  listUiCategories,
  loadUiIndex,
  searchUiIcons,
} from "./ui-data";
import { errorResult, textResult, type TextToolResult } from "./tool-helpers";

const FETCH_TIMEOUT_MS = 10_000;

const notFound = (slug: string): TextToolResult =>
  errorResult(
    `UI icon not found: "${slug}". Use search_icons with kind "ui" to find the correct slug.`
  );

async function guard(run: () => Promise<TextToolResult>): Promise<TextToolResult> {
  try {
    return await run();
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : String(err));
  }
}

export function uiSearch(query: string, limit: number): Promise<TextToolResult> {
  return guard(async () => {
    const results = await searchUiIcons(query, limit);
    if (results.length === 0) {
      return {
        ...textResult(`No UI icons found matching "${query}".`),
        structuredContent: { query, count: 0, icons: [] },
      };
    }
    return {
      ...textResult(
        [
          `Found ${results.length} UI icon${results.length === 1 ? "" : "s"} for "${query}":`,
          "",
          ...results.map(
            (i) =>
              `- **${i.title}** (slug: \`${i.slug}\`) | category: ${i.category} | tags: ${i.tags.join(", ")}`
          ),
        ].join("\n")
      ),
      structuredContent: {
        query,
        count: results.length,
        icons: results.map((i) => ({
          slug: i.slug,
          name: i.title,
          url: buildUiUrl(i.slug, "outline"),
        })),
      },
    };
  });
}

export function uiGet(slug: string, look: string): Promise<TextToolResult> {
  return guard(async () => {
    const index = await loadUiIndex();
    const bad = checkLook(index, look);
    if (bad) return errorResult(bad);
    const icon = index.icons.find((i) => i.slug === slug);
    if (!icon) return notFound(slug);

    const url = buildUiUrl(slug, look);
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      return errorResult(
        `Could not fetch SVG for UI icon "${slug}" look "${look}" (${res.status}).`
      );
    }
    const svg = await res.text();

    return textResult(
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

export function uiUrl(slug: string, look: string): Promise<TextToolResult> {
  return guard(async () => {
    const index = await loadUiIndex();
    const bad = checkLook(index, look);
    if (bad) return errorResult(bad);
    const icon = index.icons.find((i) => i.slug === slug);
    if (!icon) return notFound(slug);
    const url = buildUiUrl(slug, look);
    return textResult(
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

export function uiLooks(slug: string): Promise<TextToolResult> {
  return guard(async () => {
    const index = await loadUiIndex();
    const icon = index.icons.find((i) => i.slug === slug);
    if (!icon) return notFound(slug);
    return textResult(
      [
        `**${icon.title}** (\`${icon.slug}\`) has ${index.looks.length} looks:`,
        "",
        ...index.looks.map((l) => `- \`${l}\` -- ${buildUiUrl(slug, l)}`),
      ].join("\n")
    );
  });
}

export function uiCategories(): Promise<TextToolResult> {
  return guard(async () => {
    const cats = await listUiCategories();
    const total = (await loadUiIndex()).icons.length;
    if (cats.length === 0) return textResult("No categories found.");
    return textResult(
      [
        `${cats.length} categories across ${total} UI icons:`,
        "",
        ...cats.map((c) => `- **${c.name}** - ${c.count} icon${c.count === 1 ? "" : "s"}`),
      ].join("\n")
    );
  });
}
