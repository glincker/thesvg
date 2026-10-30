import synonymGroups from "@/data/ui/synonyms.json";

const norm = (s: string): string => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export interface Searchable {
  /** Primary name, the slug for UI icons. */
  name: string;
  /** Display title when different from the name. */
  title?: string;
  /** Aliases, tags and categories, weakest signal first-class but still counted. */
  extra: string[];
  /** Broad labels such as a category. They only break ties, a tag or name match always wins. */
  weak?: string[];
  /** Craft or popularity score. It only orders results that matched equally well. */
  boost?: number;
}

// Words that mean the same thing for an icon, so "bin" finds trash and "cog" finds settings.
const SYNONYMS = new Map<string, Set<string>>();
for (const group of synonymGroups as string[][]) {
  for (const w of group) {
    const set = SYNONYMS.get(w) ?? new Set<string>();
    for (const other of group) if (other !== w) set.add(other);
    SYNONYMS.set(w, set);
  }
}

/** Plain plural and -ing endings, so "arrows" finds "arrow" and "settings" finds "setting". */
export function stem(word: string): string {
  if (word.length < 4) return word;
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Edit distance counting a swap of two neighbours as one edit, with an early exit past `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array<number>(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  let cur = new Array<number>(b.length + 1).fill(0);
  let two = prev2;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0] ?? i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, (two[j - 2] ?? 0) + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    [two, prev, cur] = [prev, cur, two];
  }
  return prev[b.length] ?? max + 1;
}

/** Scores one token against one entry, 0 when it does not match at all. */
function tokenScore(t: string, name: string, title: string, extra: string[], weak: string[]): number {
  if (name === t) return 120;
  if (title === t) return 110;
  if (name.split(" ").includes(t)) return 96;
  if (name.startsWith(t)) return 80;
  if (title.startsWith(t)) return 72;
  if (name.split(" ").some((w) => w.startsWith(t))) return 56;
  if (title.split(" ").some((w) => w.startsWith(t))) return 50;
  if (extra.some((e) => e === t)) return 40;
  if (extra.some((e) => e.split(" ").some((w) => w.startsWith(t)))) return 30;
  if (name.includes(t) || title.includes(t)) return 22;
  if (weak.some((w) => w === t)) return 14;
  if (extra.some((e) => e.includes(t))) return 12;
  // Letters in order, so "nws" still finds "newspaper". Weak on purpose.
  // Only for short names, otherwise "upload" would match any long title that happens to contain those letters.
  const squashed = name.replace(/ /g, "");
  if (t.length < 3 || squashed.length > t.length + 6) return 0;
  let i = 0;
  for (const ch of squashed) if (ch === t[i]) i++;
  return i === t.length ? 6 : 0;
}

/** A typo in a word the icon already has: "serch" for "search". A typo of its own name counts more than one of a tag. Only words of five letters or more: "hand" is one letter from "wand" and "hard", and those are other icons. */
function typoScore(t: string, nameWords: string[], tagWords: string[]): number {
  if (t.length < 5) return 0;
  const max = t.length >= 9 ? 2 : 1;
  let best = 0;
  const check = (words: string[], one: number, two: number): void => {
    for (const w of words) {
      if (w.length < 4) continue;
      const d = editDistance(t, w, max);
      if (d <= max) best = Math.max(best, d === 1 ? one : two);
    }
  };
  check(nameWords, 30, 18);
  check(tagWords, 18, 11);
  return best;
}

const SYNONYM_WEIGHT = 0.7;

/** Every query word must match something, as itself, as its stem, as a synonym, or as a near typo. Higher is better. */
export function scoreEntry(query: string, e: Searchable): number {
  const tokens = norm(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return 0;
  const name = norm(e.name);
  const title = norm(e.title ?? e.name);
  const extra = e.extra.map(norm);
  const weak = (e.weak ?? []).map(norm);
  let total = 0;
  for (const t of tokens) {
    let s = tokenScore(t, name, title, extra, weak);
    const st = stem(t);
    if (st !== t) s = Math.max(s, tokenScore(st, name, title, extra, weak) * 0.9);
    for (const syn of SYNONYMS.get(t) ?? SYNONYMS.get(st) ?? []) {
      // Broad labels only ever match literally, otherwise "start" would reach everything filed under Home.
      s = Math.max(s, tokenScore(syn, name, title, extra, []) * SYNONYM_WEIGHT);
    }
    if (s === 0) s = typoScore(t, [...name.split(" "), ...title.split(" ")], extra.flatMap((x) => x.split(" ")));
    if (s === 0) return 0;
    total += s;
  }
  // Shorter names win ties, "home" before "home-assistant". Craft score only orders what matched equally.
  return total - Math.min(name.length, 40) * 0.1 + Math.min(e.boost ?? 0, 100) * 0.02;
}

export function rank<T>(query: string, items: T[], pick: (t: T) => Searchable, limit: number): T[] {
  const scored: { it: T; s: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const s = scoreEntry(query, pick(it));
    if (s > 0) scored.push({ it, s });
  }
  scored.sort((a, b) => b.s - a.s);
  const result: T[] = [];
  const end = Math.min(scored.length, limit);
  for (let i = 0; i < end; i++) {
    result.push(scored[i].it);
  }
  return result;
}

/** A result is a strong match when it is within reach of the best one and clears a floor: a name, a whole word of it or a tag. */
const BEST_FLOOR = 40;
const BEST_SHARE = 0.5;

/**
 * Results in two tiers. "Best" are the strong matches, the ones a person means. "Related" are everything else that still
 * matched: a weaker tag, a synonym, a typo, a broad label. Both keep their ranked order.
 */
export function rankTiered<T>(query: string, items: T[], pick: (t: T) => Searchable): { best: T[]; related: T[] } {
  const scored: { it: T; s: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const s = scoreEntry(query, pick(it));
    if (s > 0) scored.push({ it, s });
  }
  scored.sort((a, b) => b.s - a.s);
  const top = scored[0]?.s ?? 0;
  const cut = Math.max(BEST_FLOOR, top * BEST_SHARE);
  const best: T[] = [];
  const related: T[] = [];
  for (let i = 0; i < scored.length; i++) {
    const r = scored[i];
    if (r.s >= cut) best.push(r.it);
    else related.push(r.it);
  }
  return { best, related };
}

/** The nearest known word to a query that found nothing, for a "did you mean" line. */
export function closest(query: string, candidates: string[]): string | null {
  const q = norm(query);
  if (q.length < 3) return null;
  let best: { w: string; d: number } | null = null;
  for (const raw of candidates) {
    const w = norm(raw);
    if (w === q || w.includes(" ")) continue;
    const d = editDistance(q, w, 2);
    if (d <= 2 && (!best || d < best.d)) best = { w, d };
  }
  return best?.w ?? null;
}
