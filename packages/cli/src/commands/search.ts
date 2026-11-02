import { fetchIconList, ApiError, type IconEntry } from "../utils/api.js";
import { error, info, header, dim, colorize, warn } from "../utils/colors.js";
import { fetchUiIconList } from "../utils/ui.js";

interface SearchOptions {
  query: string;
  limit: number;
  /** Only set when --ui is passed, so brand-only parsing is unchanged. */
  ui?: boolean;
}

export function parseSearchArgs(args: string[]): SearchOptions {
  let query = "";
  let limit = 20;
  let ui = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--ui") {
      ui = true;
    } else if (arg === "--limit" || arg === "-l") {
      const val = parseInt(args[++i] ?? "20", 10);
      if (!isNaN(val) && val > 0) limit = val;
    } else if (arg?.startsWith("--limit=")) {
      const val = parseInt(arg.slice("--limit=".length), 10);
      if (!isNaN(val) && val > 0) limit = val;
    } else if (arg && !arg.startsWith("-")) {
      // Collect all non-flag arguments as the query
      query = query ? `${query} ${arg}` : arg;
    }
  }

  const result: SearchOptions = { query, limit };
  if (ui) result.ui = true;
  return result;
}

async function runSearchUi(opts: SearchOptions): Promise<void> {
  console.log(info(`Searching UI icons for "${opts.query}"...`));

  let result;
  try {
    result = await fetchUiIconList({ query: opts.query, limit: opts.limit });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(error(`UI search failed: ${message}`));
    process.exit(1);
  }

  if (result.icons.length === 0) {
    console.log(warn(`\nNo UI icons found matching "${opts.query}"`));
    return;
  }

  console.log(
    header(`\nFound ${result.total} UI result${result.total === 1 ? "" : "s"} for "${opts.query}"`)
  );
  console.log();
  const maxSlug = Math.max(4, ...result.icons.map((i) => i.slug.length));
  const maxTitle = Math.max(5, ...result.icons.map((i) => i.title.length));
  for (const icon of result.icons) {
    console.log(
      `  ${colorize("cyan", icon.slug.padEnd(maxSlug))}  ${icon.title.padEnd(maxTitle)}  ${dim(icon.category)}`
    );
  }
  console.log();
  console.log(dim(`  Run "thesvg add ui:<slug> [--look glass]" to add a UI icon.`));
}

/**
 * Simple fuzzy match: returns true if every character of needle appears
 * in order within haystack (case-insensitive).
 */
function fuzzyMatch(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let hi = 0;
  for (let ni = 0; ni < n.length; ni++) {
    const ch = n[ni];
    if (ch === undefined) continue;
    const found = h.indexOf(ch, hi);
    if (found === -1) return false;
    hi = found + 1;
  }
  return true;
}

/**
 * Score a match: lower score = better match.
 * Exact slug match > slug contains > title match > alias match.
 */
function scoreMatch(icon: IconEntry, query: string): number {
  const q = query.toLowerCase();

  if (icon.slug === q) return 0;
  if (icon.slug.startsWith(q)) return 1;
  if (icon.slug.includes(q)) return 2;
  if (icon.title.toLowerCase() === q) return 3;
  if (icon.title.toLowerCase().startsWith(q)) return 4;
  if (icon.title.toLowerCase().includes(q)) return 5;
  if (icon.aliases.some((a) => a.toLowerCase() === q)) return 6;
  if (icon.aliases.some((a) => a.toLowerCase().includes(q))) return 7;

  return 8;
}

export async function runSearch(args: string[]): Promise<void> {
  const opts = parseSearchArgs(args);

  if (!opts.query) {
    console.error(error("No search query provided."));
    console.error(dim("Usage: thesvg search <query> [--ui]"));
    console.error(dim("       thesvg search github"));
    process.exit(1);
  }

  if (opts.ui) return runSearchUi(opts);

  console.log(info(`Searching for "${opts.query}"...`));

  let allIcons: IconEntry[];
  try {
    // Fetch a large batch server-side filtered by query, then also do client-side fuzzy
    const result = await fetchIconList({
      query: opts.query,
      limit: 200,
    });
    allIcons = result.icons;
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(error(`Search failed: ${err.message}`));
    } else if (err instanceof Error) {
      console.error(error(`Search failed: ${err.message}`));
    } else {
      console.error(error("Search failed: Unknown error"));
    }
    process.exit(1);
  }

  // Apply client-side fuzzy filter for more permissive matching
  const queryWords = opts.query.toLowerCase().split(/\s+/);

  const matched = allIcons.filter((icon) => {
    const searchable = [
      icon.slug,
      icon.title,
      ...icon.aliases,
      ...icon.categories,
    ]
      .join(" ")
      .toLowerCase();

    return queryWords.every(
      (word) =>
        searchable.includes(word) || fuzzyMatch(searchable, word)
    );
  });

  // Sort by relevance score
  matched.sort((a, b) => scoreMatch(a, opts.query) - scoreMatch(b, opts.query));

  const results = matched.slice(0, opts.limit);

  if (results.length === 0) {
    console.log(warn(`\nNo icons found matching "${opts.query}"`));
    console.log(
      dim(
        `  Try a different search term, or run "thesvg list" to see all icons.`
      )
    );
    return;
  }

  const total = matched.length;
  console.log(
    header(
      `\nFound ${total} result${total === 1 ? "" : "s"} for "${opts.query}"`
    )
  );

  if (results.length < total) {
    console.log(dim(`  (showing top ${results.length})`));
  }

  console.log();

  const maxSlug = Math.max(4, ...results.map((i) => i.slug.length));
  const maxTitle = Math.max(5, ...results.map((i) => i.title.length));

  console.log(
    `  ${colorize("bold", "Slug".padEnd(maxSlug))}  ${colorize("bold", "Title".padEnd(maxTitle))}  ${colorize("bold", "Variants")}`
  );
  console.log(
    `  ${"-".repeat(maxSlug)}  ${"-".repeat(maxTitle)}  ${"-".repeat(20)}`
  );

  for (const icon of results) {
    const slug = colorize("cyan", icon.slug.padEnd(maxSlug));
    const title = icon.title.padEnd(maxTitle);
    const variants = dim(
      Object.entries(icon.variants)
        .filter(([, v]) => v !== undefined)
        .map(([k]) => k)
        .join(", ")
    );
    console.log(`  ${slug}  ${title}  ${variants}`);
  }

  console.log();
  console.log(
    dim(`  Run "thesvg add <slug>" to add an icon to your project.`)
  );
}
