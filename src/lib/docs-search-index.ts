import { DOCS_NAV, slugifyHeading } from "@/lib/docs-nav";
import { FRAMEWORK_GUIDES_BY_ID, FAQ_ITEMS } from "@/lib/docs-content";
import { RECIPES } from "@/lib/docs-recipes";

export interface DocsSearchEntry {
  title: string;
  description: string;
  url: string;
  lowerTitle: string;
  lowerDescription: string;
}

/**
 * Small, static, flat index for the header's "quick search" - not a full
 * Fuse.js pass like icons get, just enough entries (~25) that plain
 * substring matching against title+description is fast and good enough.
 * Rebuild this if docs content structure changes materially.
 */
function buildDocsSearchIndex(): DocsSearchEntry[] {
  const entries: DocsSearchEntry[] = [];

  for (const group of DOCS_NAV) {
    for (const item of group.items) {
      const guideId = item.href.startsWith("/docs/") ? item.href.slice(6) : "";
      const guide = FRAMEWORK_GUIDES_BY_ID.get(guideId);
      const title = item.label;
      const description = guide?.summary ?? "";
      entries.push({
        title,
        description,
        url: item.href,
        lowerTitle: title.toLowerCase(),
        lowerDescription: description.toLowerCase(),
      });
    }
  }

  for (const recipe of RECIPES) {
    const title = recipe.title;
    const description = recipe.description;
    entries.push({
      title,
      description,
      url: `/docs/recipes#${recipe.id}`,
      lowerTitle: title.toLowerCase(),
      lowerDescription: description.toLowerCase(),
    });
  }

  for (const item of FAQ_ITEMS) {
    const title = item.question;
    const description = item.answer;
    entries.push({
      title,
      description,
      url: `/docs/faq#${slugifyHeading(item.question)}`,
      lowerTitle: title.toLowerCase(),
      lowerDescription: description.toLowerCase(),
    });
  }

  return entries;
}

export const DOCS_SEARCH_INDEX: DocsSearchEntry[] = buildDocsSearchIndex();

export function searchDocs(query: string, limit = 4): DocsSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: DocsSearchEntry[] = [];
  for (let i = 0; i < DOCS_SEARCH_INDEX.length; i++) {
    if (out.length >= limit) break;
    const entry = DOCS_SEARCH_INDEX[i];
    if (entry.lowerTitle.includes(q) || entry.lowerDescription.includes(q)) {
      out.push(entry);
    }
  }
  return out;
}
