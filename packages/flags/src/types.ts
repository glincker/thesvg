/** Which shape of a flag to render. "4x3" is the default rectangle. */
export type FlagVariant = "4x3" | "square" | "circle";

export type FlagKind = "iso" | "user-assigned" | "subdivision" | "region" | "organization";

export interface FlagMeta {
  /** Registry slug, e.g. "flag-us" or "flag-gb-eng". */
  slug: string;
  /** Lowercase code used in module names, e.g. "us" or "gb-eng". */
  code: string;
  /** ISO 3166-1 alpha-2 in uppercase, or null for non-ISO flags. */
  iso: string | null;
  alpha3: string | null;
  numeric: string | null;
  /** Common English name. */
  name: string;
  /** Official English name where the source has one. */
  official: string;
  /** Name in the country's main non-English language, when known. */
  native: string | null;
  emoji: string | null;
  kind: FlagKind;
  /** ISO code of the country a subdivision belongs to. */
  parent: string | null;
  continent: string | null;
  capital: string | null;
  /** Language subtags that are official or widely spoken there. */
  languages: string[];
  /** Locale tags this flag is a hint for (BCP 47 casing, e.g. "pt-BR"). A flag is a country, not a language. */
  flagOf: string[];
  /** Normalized search aliases: alternative names, codes, locale tags. */
  aliases: string[];
  /** Palette in painted-area order: hex without #, share in percent. */
  colors: { hex: string; share: number }[];
  /** Color families (red, blue, gold and so on) with at least 5 percent share. */
  colorNames: string[];
  /** Always default (4x3), square and circle. */
  variants: string[];
}

export interface FlagLocaleResult {
  slug: string;
  code: string;
  name: string;
}
