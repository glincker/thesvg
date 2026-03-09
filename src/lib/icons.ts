import iconsData from "@/data/icons.json";

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
    wordmark?: string;
    wordmarkLight?: string;
    wordmarkDark?: string;
  };
  license: string;
  url?: string;
  guidelines?: string;
}

const icons = iconsData as IconEntry[];

export function getAllIcons(): IconEntry[] {
  return icons;
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

export function getCategoryCounts(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const icon of icons) {
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

export function getFormattedIconCount(): string {
  return icons.length.toLocaleString("en-US");
}

export function getVariantCount(): number {
  let count = 0;
  for (const icon of icons) {
    count += Object.values(icon.variants).filter(Boolean).length;
  }
  return count;
}
