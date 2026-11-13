import { FLAGS } from "./data/flags.generated.js";
import type { FlagLocaleResult } from "./types.js";

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

const byCode = new Map(FLAGS.map((f) => [f.code, f]));

function result(code: string): FlagLocaleResult | undefined {
  const flag = byCode.get(code);
  return flag ? { slug: flag.slug, code: flag.code, name: flag.name } : undefined;
}

/**
 * Resolve a BCP 47 locale to a flag. Order: exact mapping, then the region
 * subtag (fr-CA gives Canada), then the bare language mapping. Returns
 * undefined when nothing fits, so callers can fall back to text only.
 */
export function getFlagForLocale(locale: string): FlagLocaleResult | undefined {
  const parts = locale.trim().replace(/_/g, "-").toLowerCase().split("-").filter(Boolean);
  if (parts.length === 0) return undefined;
  const [lang] = parts;
  const exact = LOCALE_FLAGS[parts.slice(0, 2).join("-")];
  if (parts.length > 1 && exact) return result(exact);
  const region = parts.slice(1).find((p) => p.length === 2 && /^[a-z]{2}$/.test(p));
  if (region) {
    const hit = result(region);
    if (hit) return hit;
  }
  const bare = LOCALE_FLAGS[lang];
  return bare ? result(bare) : undefined;
}
