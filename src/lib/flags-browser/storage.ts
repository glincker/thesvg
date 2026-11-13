/** localStorage helpers that never throw: private windows, blocked storage and bad JSON all fall back to defaults. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const PREFS_KEY = "thesvg.flags.prefs";
export const RECENT_KEY = "thesvg.flags.recent";
export const STARRED_KEY = "thesvg.flags.starred";

/** Add `code` to the front of a capped, de-duplicated list. */
export function pushCapped(list: readonly string[], code: string, cap: number): string[] {
  return [code, ...list.filter((c) => c !== code)].slice(0, cap);
}

/** Toggle membership; new entries go first and the list is capped. */
export function toggleCapped(list: readonly string[], code: string, cap: number): string[] {
  return list.includes(code) ? list.filter((c) => c !== code) : [code, ...list].slice(0, cap);
}
