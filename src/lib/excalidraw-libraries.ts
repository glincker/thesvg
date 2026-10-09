import { ARCHITECTURE_COLLECTIONS, type IconEntry } from "./icons";

/**
 * Category definitions for the downloadable Excalidraw shape libraries.
 *
 * This intentionally duplicates the small config used by the sibling
 * draw.io shape library feature (`drawio-libraries.ts`) instead of sharing
 * it, so the two features can be reviewed and shipped independently.
 *
 * Architecture collections ("aws" | "azure" | "gcp" | "k8s") are excluded:
 * Excalidraw has no built-in cloud provider icon set the way draw.io does,
 * and those collections carry vendor-specific taxonomy categories
 * (Compute, Integration, Kubernetes, ...) that would swamp the brand
 * categories below.
 *
 * `matchKey` is compared case-insensitively against each icon's
 * `categories` array. The source data has a confirmed casing bug where
 * "DevTool" and "Devtool" both occur (distinct from the separate literal
 * "Developer Tools" category); matching the lowercase key "devtool" merges
 * both casing variants into a single "Developer Tools" bucket.
 *
 * "Compute" is deliberately not included: every compute-tagged icon
 * belongs to an excluded architecture collection, so it would net zero
 * icons.
 */
export interface ExcalidrawLibraryCategory {
  slug: string;
  label: string;
  matchKey: string;
}

export const EXCALIDRAW_LIBRARIES: ExcalidrawLibraryCategory[] = [
  { slug: "developer-tools", label: "Developer Tools", matchKey: "devtool" },
  { slug: "ai", label: "AI", matchKey: "ai" },
  { slug: "finance", label: "Finance", matchKey: "finance" },
  { slug: "database", label: "Database", matchKey: "database" },
  { slug: "networking", label: "Networking", matchKey: "networking" },
  { slug: "security", label: "Security", matchKey: "security" },
  { slug: "analytics", label: "Analytics", matchKey: "analytics" },
  { slug: "iot", label: "IoT", matchKey: "iot" },
  { slug: "framework", label: "Framework", matchKey: "framework" },
  { slug: "storage", label: "Storage", matchKey: "storage" },
  { slug: "design", label: "Design", matchKey: "design" },
  { slug: "language", label: "Language", matchKey: "language" },
];

export function getIconsForExcalidrawLibrary(
  icons: IconEntry[],
  lib: ExcalidrawLibraryCategory,
): IconEntry[] {
  // ⚡ Bolt: Single-pass for loop to avoid multiple allocations from chained .filter().some()
  const matchKey = lib.matchKey.toLowerCase();
  const result: IconEntry[] = [];

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    if (ARCHITECTURE_COLLECTIONS.has(icon.collection)) continue;

    const categories = icon.categories;
    for (let j = 0; j < categories.length; j++) {
      if (categories[j].toLowerCase() === matchKey) {
        result.push(icon);
        break;
      }
    }
  }
  return result;
}
