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
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const letter = letterFor(category.name);
    const bucket = groups.get(letter);
    if (bucket) {
      bucket.push(category);
    } else {
      groups.set(letter, [category]);
    }
  }
  // ⚡ Bolt: Use a single-pass loop instead of chained .filter().map()
  // to avoid intermediate array allocations.
  const result: CategoryGroup[] = [];
  for (let i = 0; i < ALPHABET.length; i++) {
    const letter = ALPHABET[i];
    const bucket = groups.get(letter);
    if (bucket) {
      result.push({ letter, categories: bucket });
    }
  }
  return result;
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
  // ⚡ Bolt: Use a single-pass for loop instead of .filter() to avoid
  // function allocation overhead inside the filter callback.
  const result: { name: string; count: number }[] = [];
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    if (category.name.toLowerCase().includes(q)) {
      result.push(category);
    }
  }
  return result;
}
