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

/**
 * Resolve a BCP 47 locale to a flag. Order: exact language-region mapping, then the
 * region subtag (fr-CA gives Canada), then script, then the bare language mapping.
 * Returns undefined when nothing fits, so callers can fall back to text only.
 */
export function getFlagForLocale(locale: string): FlagLocaleResult | undefined {
  const p = parseLocale(locale);
  if (!p) return undefined;
  if (p.region) {
    const exact = LOCALE_FLAGS[`${p.language}-${p.region}`];
    if (exact) return result(exact);
    const hit = /^[a-z]{2}$/.test(p.region) ? result(p.region) : undefined;
    if (hit) return hit;
  }
  if (p.script) {
    const hit = SCRIPT_FLAGS[`${p.language}-${p.script}`];
    if (hit) return result(hit);
  }
  const bare = LOCALE_FLAGS[p.language] ?? (p.language === "zh" ? "cn" : undefined);
  return bare ? result(bare) : undefined;
}
