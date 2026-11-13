import { FLAGS } from "../../packages/flags/src/data/flags.generated";

export type FlagEntry = (typeof FLAGS)[number];

const bySlug = new Map<string, FlagEntry>(FLAGS.map((f) => [f.slug, f]));

export const getFlagBySlug = (slug: string): FlagEntry | undefined => bySlug.get(slug);

/** Title and description written for searches like "germany flag svg" or "de flag". */
export function flagSeo(f: FlagEntry): { title: string; description: string; keywords: string[] } {
  const codes = [f.iso, f.alpha3].filter(Boolean).join(", ");
  const title = `${f.name} Flag SVG${codes ? ` (${codes})` : ""} - Free Download | theSVG`;
  const description =
    `Download the ${f.name} flag as SVG for free: 4x3 rectangle, square and circle.` +
    (f.capital ? ` Capital ${f.capital}.` : "") +
    ` Copy as SVG or React, use the CDN link, or install @thesvg/flags.`;
  const keywords = [
    `${f.name} flag`,
    `${f.name} flag SVG`,
    `${f.name} flag download`,
    ...(f.native && f.native !== f.name ? [`${f.native} flag`] : []),
    ...(f.iso ? [`${f.iso} flag`, `${f.iso} flag SVG`] : []),
    ...(f.alpha3 ? [`${f.alpha3} flag`] : []),
    "flag SVG",
    "country flags SVG",
    "circle flag SVG",
    "free flag icons",
  ];
  return { title, description, keywords };
}

const hex = (c: { hex: string } | string): string => (typeof c === "string" ? c : c.hex);
export const flagColors = (f: FlagEntry): string[] => (f.colors ?? []).map(hex);
