import { DOCS_NAV, slugifyHeading } from "@/lib/docs-nav";
import { FRAMEWORK_GUIDES, FAQ_ITEMS } from "@/lib/docs-content";
import { RECIPES } from "@/lib/docs-recipes";

export interface DocsSearchEntry {
  title: string;
  description: string;
  url: string;
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
      const guide = FRAMEWORK_GUIDES.find((g) => `/docs/${g.id}` === item.href);
      entries.push({
        title: item.label,
        description: guide?.summary ?? "",
        url: item.href,
      });
    }
  }

  for (const recipe of RECIPES) {
    entries.push({ title: recipe.title, description: recipe.description, url: `/docs/recipes#${recipe.id}` });
  }

  for (const item of FAQ_ITEMS) {
    entries.push({ title: item.question, description: item.answer, url: `/docs/faq#${slugifyHeading(item.question)}` });
  }

  return entries;
}

export const DOCS_SEARCH_INDEX: DocsSearchEntry[] = buildDocsSearchIndex();

export function searchDocs(query: string, limit = 4): DocsSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return DOCS_SEARCH_INDEX.filter(
    (entry) => entry.title.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q)
  ).slice(0, limit);
}
