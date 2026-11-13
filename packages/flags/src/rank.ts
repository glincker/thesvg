/**
 * Pure alias ranking shared by findFlags and the website's flag browser, so both
 * resolve a query the same way. No data imports, so it stays a few hundred bytes.
 */
export const fold = (s: string): string =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\s'.,()&\-’]+$/u;

/** Same normalization as the generator uses for aliases: NFKC, lowercase, Latin diacritics folded, scripts kept. */
export const squash = (s: string): string => {
  let t = s.normalize("NFKC").toLowerCase();
  if (LATIN_ONLY.test(t)) t = t.normalize("NFKD").replace(/\p{M}/gu, "");
  return t.replace(/[^\p{L}\p{N}\p{M}\s'.]/gu, " ").replace(/['.]/g, "").replace(/\s+/g, " ").trim();
};

/**
 * 0 exact term, 1 prefix, 2 substring or all words matched, 3 no match.
 * `terms` must already be normalized (names through fold or squash, aliases as generated).
 */
export function rankTerms(terms: readonly string[], query: string): number {
  const raw = fold(query).replace(/_/g, "-").replace(/^#(?=[0-9a-f]{3,6}$)/, "");
  if (!raw) return 3;
  const forms = [...new Set([raw, squash(query)].filter(Boolean))];
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
}
