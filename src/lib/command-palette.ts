import type { IconEntry } from "@/lib/icons";
import type { RecentSearched, RecentViewed } from "@/lib/stores/recents-store";

export const PALETTE_ICON_LIMIT = 8;
export const PALETTE_CATEGORY_LIMIT = 6;
export const PALETTE_RECENT_ICON_LIMIT = 5;
export const PALETTE_RECENT_SEARCH_LIMIT = 3;

export interface PaletteCategory {
  name: string;
  count: number;
}

export type PaletteAction =
  | { id: string; label: string; kind: "navigate"; href: string }
  | { id: string; label: string; kind: "copy"; slug: string; format: "svg" | "jsx" };

const NAVIGATE_ACTIONS: readonly PaletteAction[] = [
  { id: "submit", label: "Submit an icon", kind: "navigate", href: "/submit" },
  { id: "docs", label: "Read the docs", kind: "navigate", href: "/docs" },
  { id: "integrations", label: "Browse integrations", kind: "navigate", href: "/extensions" },
];

export function categoriesFromIcons(icons: readonly IconEntry[]): PaletteCategory[] {
  const counts = new Map<string, number>();
  for (const icon of icons) {
    for (const name of icon.categories) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  // ⚡ Bolt: Single-pass for loop avoiding redundant array allocations from [...].map()
  const out: PaletteCategory[] = [];
  for (const [name, count] of counts) {
    out.push({ name, count });
  }
  return out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** 0 = prefix, 1 = word start, 2 = substring, -1 = no match. */
function matchRank(text: string, needle: string): number {
  const haystack = text.toLowerCase();
  if (haystack.startsWith(needle)) return 0;
  if (haystack.includes(` ${needle}`)) return 1;
  if (haystack.includes(needle)) return 2;
  return -1;
}

export function filterCategories(
  categories: readonly PaletteCategory[],
  query: string,
  limit = PALETTE_CATEGORY_LIMIT,
): PaletteCategory[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return categories.slice(0, limit);
  const ranked: { category: PaletteCategory; rank: number }[] = [];
  for (const category of categories) {
    const rank = matchRank(category.name, needle);
    if (rank !== -1) ranked.push({ category, rank });
  }
  // Array.sort is stable, so equal ranks keep the count-descending order.
  ranked.sort((a, b) => a.rank - b.rank);
  return ranked.slice(0, limit).map((r) => r.category);
}

export function buildActions(lastCopied: IconEntry | undefined): PaletteAction[] {
  const actions: PaletteAction[] = [];
  if (lastCopied) {
    actions.push(
      {
        id: "copy-svg",
        label: `Copy ${lastCopied.title} as SVG`,
        kind: "copy",
        slug: lastCopied.slug,
        format: "svg",
      },
      {
        id: "copy-jsx",
        label: `Copy ${lastCopied.title} as JSX`,
        kind: "copy",
        slug: lastCopied.slug,
        format: "jsx",
      },
    );
  }
  return [...actions, ...NAVIGATE_ACTIONS];
}

export function filterActions(
  actions: readonly PaletteAction[],
  query: string,
): PaletteAction[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...actions];
  return actions.filter((action) => matchRank(action.label, needle) !== -1);
}

export function resolveRecentIcons(
  viewed: readonly RecentViewed[],
  bySlug: ReadonlyMap<string, IconEntry>,
  limit = PALETTE_RECENT_ICON_LIMIT,
): IconEntry[] {
  const out: IconEntry[] = [];
  for (const entry of viewed) {
    const icon = bySlug.get(entry.slug);
    if (icon) out.push(icon);
    if (out.length >= limit) break;
  }
  return out;
}

export function recentSearchQueries(
  searched: readonly RecentSearched[],
  limit = PALETTE_RECENT_SEARCH_LIMIT,
): string[] {
  return searched.slice(0, limit).map((s) => s.query);
}
