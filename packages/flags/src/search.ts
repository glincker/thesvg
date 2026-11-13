import { FLAGS } from "./data/flags.generated.js";
import type { FlagMeta } from "./types.js";

export { FLAGS } from "./data/flags.generated.js";
export type { FlagKind, FlagLocaleResult, FlagMeta, FlagVariant } from "./types.js";

const bySlug = new Map(FLAGS.map((f) => [f.slug, f]));
const byCode = new Map(FLAGS.map((f) => [f.code, f]));

const fold = (s: string): string =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\s'.,()&\-\u2019]+$/u;

/** Same normalization as the generator uses for aliases: NFKC, lowercase, Latin diacritics folded, scripts kept. */
export const squash = (s: string): string => {
  let t = s.normalize("NFKC").toLowerCase();
  if (LATIN_ONLY.test(t)) t = t.normalize("NFKD").replace(/\p{M}/gu, "");
  return t.replace(/[^\p{L}\p{N}\p{M}\s'.]/gu, " ").replace(/['.]/g, "").replace(/\s+/g, " ").trim();
};

/** Look a flag up by slug ("flag-us"), lowercase code ("us", "gb-eng") or ISO alpha-2/alpha-3. */
export function getFlag(id: string): FlagMeta | undefined {
  const key = fold(id);
  return bySlug.get(key) ?? byCode.get(key) ?? FLAGS.find((f) => f.alpha3?.toLowerCase() === key);
}

/**
 * Find flags by any alias: English or native name, ISO alpha-2, alpha-3 or
 * numeric code, emoji, former names, demonyms, locale tags (pt-BR).
 * Exact alias hits come first, then names that start with the query, then
 * substring hits. No fuzzy matching: use the site search for typo tolerance.
 */
export function findFlags(query: string): FlagMeta[] {
  const raw = fold(query).replace(/_/g, "-");
  if (!raw) return [];
  const forms = [...new Set([raw, squash(query)].filter(Boolean))];
  const rank = (f: FlagMeta): number => {
    const terms = [fold(f.name), squash(f.official), f.native ? squash(f.native) : "", f.slug, f.code, ...f.aliases].filter(Boolean);
    let best = 3;
    for (const q of forms) {
      if (terms.includes(q)) return 0;
      if (terms.some((t) => t.startsWith(q))) best = Math.min(best, 1);
      else if (q.length >= (/[^\x00-\x7f]/.test(q) ? 2 : 3) && terms.some((t) => t.includes(q))) best = Math.min(best, 2);
    }
    if (best === 3) {
      // Multi-word queries such as "red white blue": every word must match a term.
      const words = squash(query).split(" ").filter(Boolean);
      if (words.length > 1 && words.every((w) => terms.some((t) => t === w || t.split(" ").includes(w)))) return 2;
    }
    return best;
  };
  return FLAGS.map((f) => ({ f, r: rank(f) }))
    .filter((x) => x.r < 3)
    .sort((a, b) => a.r - b.r || a.f.name.localeCompare(b.f.name))
    .map((x) => x.f);
}
