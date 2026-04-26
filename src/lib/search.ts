import Fuse from "fuse.js";
import type { IconEntry } from "./icons";

let lastIcons: IconEntry[] | null = null;
let fuseInstance: Fuse<IconEntry> | null = null;

export function getSearchIndex(icons: IconEntry[]): Fuse<IconEntry> {
  if (!fuseInstance || lastIcons !== icons) {
    lastIcons = icons;
    fuseInstance = new Fuse(icons, {
      keys: [
        { name: "title", weight: 3 },
        { name: "slug", weight: 2 },
        { name: "aliases", weight: 1.5 },
        { name: "categories", weight: 1 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }
  return fuseInstance;
}

export function searchIcons(
  icons: IconEntry[],
  query: string
): IconEntry[] {
  if (!query.trim()) return icons;
  const fuse = getSearchIndex(icons);
  return fuse.search(query).map((r) => r.item);
}
