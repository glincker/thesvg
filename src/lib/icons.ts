import iconsData from "@/data/icons.json";

export type Collection = "brands" | "aws" | "gcp" | "azure" | "emojis" | "k8s" | "community";

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

export function getIconBySlug(slug: string): IconEntry | undefined {
  return icons.find((icon) => icon.slug === slug);
}

export function getIconsByCategory(category: string): IconEntry[] {
  return icons.filter((icon) =>
    icon.categories.some((c) => c.toLowerCase() === category.toLowerCase())
  );
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

export function getRecentlyAddedIcons(limit = 12): IconEntry[] {
  return [...icons]
    .filter((i) => i.dateAdded)
    .sort((a, b) => (b.dateAdded as string).localeCompare(a.dateAdded as string))
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
