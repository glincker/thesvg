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
}

/** Scores one token against one entry, 0 when it does not match at all. */
function tokenScore(t: string, name: string, title: string, extra: string[], weak: string[]): number {
  if (name === t) return 120;
  if (title === t) return 110;
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

/** Every query word must match something. Higher is a better match. */
export function scoreEntry(query: string, e: Searchable): number {
  const tokens = norm(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return 0;
  const name = norm(e.name);
  const title = norm(e.title ?? e.name);
  const extra = e.extra.map(norm);
  const weak = (e.weak ?? []).map(norm);
  let total = 0;
  for (const t of tokens) {
    const s = tokenScore(t, name, title, extra, weak);
    if (s === 0) return 0;
    total += s;
  }
  // Shorter names win ties, "home" before "home-assistant".
  return total - Math.min(name.length, 40) * 0.1;
}

export function rank<T>(query: string, items: T[], pick: (t: T) => Searchable, limit: number): T[] {
  return items
    .map((it) => ({ it, s: scoreEntry(query, pick(it)) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.it);
}
