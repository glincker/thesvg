import { FLAGS } from "./data/flags.generated.js";
import { fold, rankTerms, squash } from "./rank.js";
import type { FlagMeta } from "./types.js";

export { FLAGS } from "./data/flags.generated.js";
export { squash } from "./rank.js";

const bySlug = new Map(FLAGS.map((f) => [f.slug, f]));
const byCode = new Map(FLAGS.map((f) => [f.code, f]));

/** Look a flag up by slug ("flag-us"), lowercase code ("us", "gb-eng") or ISO alpha-2/alpha-3. */
export function getFlag(id: string): FlagMeta | undefined {
  const key = fold(id);
  return bySlug.get(key) ?? byCode.get(key) ?? FLAGS.find((f) => f.alpha3?.toLowerCase() === key);
}

/**
 * Find flags by any alias: English or native name, ISO alpha-2, alpha-3 or
 * numeric code, emoji, former names, demonyms, locale tags (pt-BR), color words.
 * Exact alias hits come first, then names that start with the query, then
 * substring hits. No fuzzy matching: use the site search for typo tolerance.
 */
export function findFlags(query: string): FlagMeta[] {
  return FLAGS.map((f) => ({ f, r: rankTerms([fold(f.name), squash(f.official), f.native ? squash(f.native) : "", f.slug, f.code, ...f.aliases].filter(Boolean), query) }))
    .filter((x) => x.r < 3)
    .sort((a, b) => a.r - b.r || a.f.name.localeCompare(b.f.name))
    .map((x) => x.f);
}
