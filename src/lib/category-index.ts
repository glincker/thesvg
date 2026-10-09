export const ALPHABET = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export interface CategoryGroup {
  letter: string;
  categories: { name: string; count: number }[];
}

function letterFor(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return first >= "A" && first <= "Z" ? first : "#";
}

/** Groups already-sorted categories by first letter, "#" for non-alpha. */
export function groupCategoriesByLetter(
  categories: { name: string; count: number }[],
): CategoryGroup[] {
  const groups = new Map<string, { name: string; count: number }[]>();
  for (const category of categories) {
    const letter = letterFor(category.name);
    const bucket = groups.get(letter);
    if (bucket) {
      bucket.push(category);
    } else {
      groups.set(letter, [category]);
    }
  }
  return ALPHABET.filter((letter) => groups.has(letter)).map((letter) => ({
    letter,
    categories: groups.get(letter)!,
  }));
}

/** Fixed palette of Tailwind background classes (not inline styles) for the
 * small per-category accent dot. A category name always hashes to the same
 * entry, so the color is stable without maintaining a lookup table. */
const CATEGORY_ACCENT_CLASSES = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-lime-400",
  "bg-emerald-400",
  "bg-teal-400",
  "bg-cyan-400",
  "bg-sky-400",
  "bg-blue-400",
  "bg-violet-400",
  "bg-pink-400",
];

export function categoryAccentClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return CATEGORY_ACCENT_CLASSES[Math.abs(hash) % CATEGORY_ACCENT_CLASSES.length];
}

export function filterCategories(
  categories: { name: string; count: number }[],
  query: string,
): { name: string; count: number }[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;
  const len = q.length;
  // Performance optimization: Pre-check string length before allocating `.toLowerCase()`
  // to avoid blocking the main thread when searching large category sets on every keystroke.
  return categories.filter((category) => {
    const name = category.name;
    return name.length >= len && name.toLowerCase().includes(q);
  });
}
