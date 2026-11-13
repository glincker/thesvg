/**
 * Locale to flag rules with no imports, so the website can use them without the package build.
 * `has` says whether a flag exists for a code; locale.ts passes the real list.
 */
/**
 * A flag stands for a country, not a language. These are the conventional
 * picks for the locales most apps ship. Show the native language name next
 * to the flag and mark the flag decorative (aria-hidden).
 */
export const LOCALE_FLAGS: Readonly<Record<string, string>> = {
  en: "us",
  "en-gb": "gb",
  es: "es",
  "es-mx": "mx",
  de: "de",
  fr: "fr",
  "pt-br": "br",
  "pt-pt": "pt",
  ja: "jp",
  "zh-cn": "cn",
  "zh-tw": "tw",
  ar: "sa",
  hi: "in",
  ru: "ru",
  ko: "kr",
  it: "it",
  nl: "nl",
  pl: "pl",
  tr: "tr",
  id: "id",
  ca: "es-ct",
  eu: "es-pv",
  gl: "es-ga",
  cy: "gb-wls",
  gd: "gb-sct",
};

/** Scripts that pick a flag when no region is given (zh-Hant is written in Taiwan, zh-Hans in China). */
const SCRIPT_FLAGS: Readonly<Record<string, string>> = { "zh-hant": "tw", "zh-hans": "cn" };

interface ParsedLocale {
  language: string;
  script?: string;
  region?: string;
}

/**
 * Parse language[-script][-region] and stop at the first singleton (u, t, x ...),
 * so extension and private-use subtags never read as a region. Returns undefined for malformed tags.
 */
function parseLocale(locale: string): ParsedLocale | undefined {
  const parts = locale.trim().replace(/_/g, "-").toLowerCase().split("-");
  const language = parts[0];
  if (!language || !/^[a-z]{2,3}$/.test(language)) return undefined;
  const out: ParsedLocale = { language };
  let i = 1;
  if (parts[i] && /^[a-z]{4}$/.test(parts[i])) out.script = parts[i++];
  if (parts[i] && (/^[a-z]{2}$/.test(parts[i]) || /^\d{3}$/.test(parts[i]))) out.region = parts[i];
  return out;
}

/** Flag code for a locale: exact language-region mapping, then region subtag, then script, then language. */
export function localeFlagCode(locale: string, has: (code: string) => boolean): string | undefined {
  const p = parseLocale(locale);
  if (!p) return undefined;
  const pick = (code: string | undefined): string | undefined => (code && has(code) ? code : undefined);
  if (p.region) {
    const hit = pick(LOCALE_FLAGS[`${p.language}-${p.region}`]) ?? (/^[a-z]{2}$/.test(p.region) ? pick(p.region) : undefined);
    if (hit) return hit;
  }
  if (p.script) {
    const hit = pick(SCRIPT_FLAGS[`${p.language}-${p.script}`]);
    if (hit) return hit;
  }
  return pick(LOCALE_FLAGS[p.language] ?? (p.language === "zh" ? "cn" : undefined));
}
