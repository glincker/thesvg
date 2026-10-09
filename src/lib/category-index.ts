export const ALPHABET = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export interface CategoryGroup {
  letter: string;
  categories: { name: string; count: number }[];
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
