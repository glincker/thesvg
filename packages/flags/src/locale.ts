import { FLAG_NAMES } from "./data/flag-names.generated.js";
import { LOCALE_FLAGS, localeFlagCode } from "./locale-core.js";
import type { FlagLocaleResult } from "./types.js";

export { LOCALE_FLAGS };

/**
 * Resolve a BCP 47 locale to a flag. Order: exact language-region mapping, then the
 * region subtag (fr-CA gives Canada), then script, then the bare language mapping.
 * Returns undefined when nothing fits, so callers can fall back to text only.
 * A flag stands for a country, not a language: show the native language name beside it.
 */
export function getFlagForLocale(locale: string): FlagLocaleResult | undefined {
  const code = localeFlagCode(locale, (c) => c in FLAG_NAMES);
  return code ? { slug: `flag-${code}`, code, name: FLAG_NAMES[code] } : undefined;
}
