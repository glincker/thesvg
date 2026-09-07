import { ARCHITECTURE_COLLECTIONS, type IconEntry } from "@/lib/icons";

/**
 * Category groupings for the draw.io / diagrams.net shape libraries.
 * Shared by the build-time generator (src/scripts/generate-drawio-libraries.ts)
 * and the /integrations/drawio listing page so counts never drift from the
 * actual generated files.
 *
 * Cloud architecture collections (aws/azure/gcp/k8s) are excluded: draw.io
 * already ships those as built-in shape libraries, so duplicating them here
 * adds no value. `categories` is matched case-insensitively against each
 * icon's `categories` array to merge the "Devtool"/"DevTool" casing split
 * in the source data.
 */
export interface DrawioLibraryDef {
  slug: string;
  label: string;
  categories: string[];
}

export const DRAWIO_LIBRARIES: DrawioLibraryDef[] = [
  { slug: "developer-tools", label: "Developer Tools", categories: ["devtool"] },
  { slug: "ai", label: "AI", categories: ["ai"] },
  { slug: "finance", label: "Finance", categories: ["finance"] },
  { slug: "database", label: "Database", categories: ["database"] },
  { slug: "networking", label: "Networking", categories: ["networking"] },
  { slug: "security", label: "Security", categories: ["security"] },
  { slug: "analytics", label: "Analytics", categories: ["analytics"] },
  { slug: "iot", label: "IoT", categories: ["iot"] },
  { slug: "framework", label: "Framework", categories: ["framework"] },
  { slug: "storage", label: "Storage", categories: ["storage"] },
  { slug: "design", label: "Design", categories: ["design"] },
  { slug: "language", label: "Language", categories: ["language"] },
];

export function getIconsForDrawioLibrary(icons: IconEntry[], lib: DrawioLibraryDef): IconEntry[] {
  const wanted = new Set(lib.categories.map((c) => c.toLowerCase()));
  return icons.filter((icon) => {
    if (ARCHITECTURE_COLLECTIONS.has(icon.collection)) return false;
    return icon.categories.some((c) => wanted.has(c.toLowerCase()));
  });
}
