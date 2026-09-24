import iconsData from "@/data/icons.json";
import type { CollectionId } from "@/lib/collections-meta";

/**
 * The canonical list of collection ids lives in `collections-meta.ts`
 * (the single source of truth for collection metadata); this type just
 * mirrors it so the rest of this data layer has no runtime dependency
 * on that module.
 */
export type Collection = CollectionId;

/**
 * Cloud architecture collections. Their icons carry vendor taxonomy categories
 * (Compute, Networking, Integration, Kubernetes, ...) that would otherwise swamp
 * the brand categories in the sidebar. We exclude them from the default category
 * list so brand categories stay front and center; their categories still surface
 * when the user explicitly selects one of these collections.
 */
export const ARCHITECTURE_COLLECTIONS: ReadonlySet<Collection> = new Set([
  "aws",
  "azure",
  "gcp",
  "k8s",
]);

export interface IconEntry {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: {
    default: string;
    light?: string;
    dark?: string;
    mono?: string;
    color?: string;
    wordmark?: string;
    wordmarkLight?: string;
    wordmarkDark?: string;
    lockup?: string;
    lockupDark?: string;
    [key: string]: string | undefined;
  };
  license: string;
  url?: string;
  guidelines?: string;
  dateAdded?: string;
  collection: Collection;
  collectionVersion?: string;
  collectionMeta?: {
    type?: string;
    parent?: string;
  };
  supersedes?: string;
  supersededBy?: string;
}

const icons = iconsData as IconEntry[];

export function getAllIcons(): IconEntry[] {
  return icons;
}

export function getIconsByCollection(collection: Collection): IconEntry[] {
  return icons.filter((icon) => icon.collection === collection);
}

let slugIndex: Map<string, IconEntry> | null = null;

export function getIconBySlug(slug: string): IconEntry | undefined {
  if (!slugIndex) {
    slugIndex = new Map();
    for (let i = 0; i < icons.length; i++) {
      slugIndex.set(icons[i].slug, icons[i]);
    }
  }
  return slugIndex.get(slug);
}

export function getIconsByCategory(category: string): IconEntry[] {
  const target = category.toLowerCase();
  const result: IconEntry[] = [];
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const cats = icon.categories;
    for (let j = 0; j < cats.length; j++) {
      if (cats[j].toLowerCase() === target) {
        result.push(icon);
        break;
      }
    }
  }
  return result;
}

export function getAllCategories(): string[] {
  const cats = new Set<string>();
  for (const icon of icons) {
    for (const c of icon.categories) {
      cats.add(c);
    }
  }
  return [...cats].sort();
}

export function getCategoryCounts(collection?: Collection): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  // Default view: count brand-relevant collections only, so cloud architecture
  // taxonomy (Compute, Integration, Kubernetes, ...) does not bury brand
  // categories. When a specific collection is requested, count just that one.
  const source = collection
    ? icons.filter((i) => i.collection === collection)
    : icons.filter((i) => !ARCHITECTURE_COLLECTIONS.has(i.collection));
  for (const icon of source) {
    for (const c of icon.categories) {
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getIconCount(): number {
  return icons.length;
}

export function getCollectionCount(collection: Collection): number {
  return icons.filter((i) => i.collection === collection).length;
}

export function getFormattedIconCount(): string {
  return icons.length.toLocaleString("en-US");
}

/**
 * Descending comparator for ISO date strings (newest first). Plain
 * inequalities instead of localeCompare since dates are predictable
 * non-localized ASCII; missing dates sort last.
 */
export function compareDateDesc(a?: string, b?: string): number {
  const dateA = a ?? "";
  const dateB = b ?? "";
  if (dateB < dateA) return -1;
  if (dateB > dateA) return 1;
  return 0;
}

export function getRecentlyAddedIcons(limit = 12): IconEntry[] {
  return [...icons]
    .filter((i) => i.dateAdded)
    .sort((a, b) => compareDateDesc(a.dateAdded, b.dateAdded))
    .slice(0, limit);
}

export function getVariantCount(): number {
  let count = 0;
  for (const icon of icons) {
    count += Object.values(icon.variants).filter(Boolean).length;
  }
  return count;
}

export function getCollections(): { name: Collection; count: number }[] {
  const counts = new Map<Collection, number>();
  for (const icon of icons) {
    counts.set(icon.collection, (counts.get(icon.collection) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
