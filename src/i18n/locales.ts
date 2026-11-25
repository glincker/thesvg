export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "thesvg:lang";

export interface LocaleMeta {
  code: string;
  /** Name in its own language, shown in the switcher. */
  label: string;
  /** Slug of the matching flag in public/icons. */
  flag: string;
}

export const LOCALES = [
  { code: "en", label: "English", flag: "flag-us" },
  { code: "es", label: "Español", flag: "flag-es" },
  { code: "fr", label: "Français", flag: "flag-fr" },
  { code: "de", label: "Deutsch", flag: "flag-de" },
  { code: "pt-BR", label: "Português (Brasil)", flag: "flag-br" },
  { code: "ja", label: "日本語", flag: "flag-jp" },
  { code: "ko", label: "한국어", flag: "flag-kr" },
  { code: "zh-CN", label: "简体中文", flag: "flag-cn" },
  { code: "ru", label: "Русский", flag: "flag-ru" },
  { code: "tr", label: "Türkçe", flag: "flag-tr" },
  { code: "hi", label: "हिन्दी", flag: "flag-in" },
] as const satisfies readonly LocaleMeta[];

export type LocaleCode = (typeof LOCALES)[number]["code"];

const CODES: readonly string[] = LOCALES.map((l) => l.code);

/** Maps a browser tag such as "pt-PT" or "zh-Hans-CN" to a supported locale, or null. */
export function matchLocale(tag: string | null | undefined): LocaleCode | null {
  if (!tag) return null;
  const exact = CODES.find((c) => c.toLowerCase() === tag.toLowerCase());
  if (exact) return exact as LocaleCode;
  const base = tag.toLowerCase().split("-")[0];
  const byBase = CODES.find((c) => c.toLowerCase().split("-")[0] === base);
  return (byBase as LocaleCode | undefined) ?? null;
}
