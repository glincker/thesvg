import Fuse from "fuse.js";
import type { IconEntry } from "./icons";

let fuseInstance: Fuse<IconEntry> | null = null;
let cachedIcons: IconEntry[] | null = null;

export function getSearchIndex(icons: IconEntry[]): Fuse<IconEntry> {
  if (fuseInstance && cachedIcons === icons) return fuseInstance;
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
    // Match a term anywhere in the field, not just near its start. The
    // default (location-weighted) scoring drops brand names whose keyword
    // sits mid-string, e.g. "studio" in "Data Studio".
    ignoreLocation: true,
  });
  cachedIcons = icons;
  return fuseInstance;
}

export function searchIcons(
  icons: IconEntry[],
  query: string
): IconEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return icons;
  const fuse = getSearchIndex(icons);

  // Split the query into word tokens so a multi-word query like "looker
  // studio" or "vs code" matches each word against every field, instead of
  // scoring the whole phrase as one term (which returns nothing when no
  // single field holds the full phrase). Tokens shorter than the index's
  // minMatchCharLength never match, so drop them.
  // Deduplicate tokens so a repeated word (e.g. "looker looker studio")
  // can't count twice for one icon and outrank an equally-relevant match.
  // ⚡ Bolt: Pre-calculate word tokens manually to avoid allocating arrays
  // inside .filter() chains in the hot path.
  const words = trimmed.toLowerCase().split(/\s+/);
  const tokenSet = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    if (words[i].length >= 2) tokenSet.add(words[i]);
  }
  const tokens = [...tokenSet];

  if (tokens.length <= 1) {
    const results = fuse.search(trimmed);
    const out: IconEntry[] = [];
    for (let i = 0; i < results.length; i++) {
      out.push(results[i].item);
    }
    return out;
  }

  // Score each icon by how many tokens it matches, then by combined Fuse
  // score. Keep only the icons that match the most tokens: an icon matching
  // every token wins, but when nothing matches all of them the search still
  // returns the closest partial matches rather than an empty result.
  const agg = new Map<string, { item: IconEntry; count: number; score: number }>();
  for (let t = 0; t < tokens.length; t++) {
    const searchResults = fuse.search(tokens[t]);
    for (let i = 0; i < searchResults.length; i++) {
      const { item, score = 1 } = searchResults[i];
      const entry = agg.get(item.slug) ?? { item, count: 0, score: 0 };
      entry.count += 1;
      entry.score += score;
      agg.set(item.slug, entry);
    }
  }

  const matches = [...agg.values()];
  let maxCount = 0;
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].count > maxCount) maxCount = matches[i].count;
  }

  // ⚡ Bolt: Single-pass filtering mapping loop instead of chained
  // .filter().sort().map() to avoid intermediary arrays.
  const filteredMatches: { item: IconEntry; count: number; score: number }[] = [];
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].count === maxCount) {
      filteredMatches.push(matches[i]);
    }
  }

  filteredMatches.sort((a, b) => a.score - b.score);

  const out: IconEntry[] = [];
  for (let i = 0; i < filteredMatches.length; i++) {
    out.push(filteredMatches[i].item);
  }

  return out;
}
