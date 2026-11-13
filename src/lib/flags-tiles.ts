import { FLAGS } from "../../packages/flags/src/data/flags.generated";
import licenses from "../../packages/flags/src/data/licenses.json";
import { regionOf, type FlagTile } from "@/lib/flags-browser/model";

const VARIANT_LABEL: Record<string, string> = { default: "4x3", square: "square", circle: "circle" };
const DEFAULT_SOURCES = new Set(["flag-icons", "circle-flags"]);
const creditsBySlug = new Map<string, FlagTile["credits"]>();
for (const e of licenses.files as { slug: string; variant: string; source: string; upstream: string; license: string }[]) {
  if (DEFAULT_SOURCES.has(e.source)) continue;
  const list = creditsBySlug.get(e.slug) ?? [];
  list.push({ variant: VARIANT_LABEL[e.variant] ?? e.variant, source: e.source, license: e.license, file: e.upstream });
  creditsBySlug.set(e.slug, list);
}

/** Compact per-flag data for the browser: no aliases (those load on first search) and no variant paths (they follow the slug). */
export function getFlagTiles(): FlagTile[] {
  return FLAGS.map((f) => ({
    code: f.code,
    slug: f.slug,
    name: f.name,
    native: f.native,
    iso: f.iso,
    alpha3: f.alpha3,
    numeric: f.numeric,
    emoji: f.emoji,
    kind: f.kind,
    region: regionOf(f.continent, f.kind),
    capital: f.capital,
    languages: f.languages,
    flagOf: f.flagOf,
    colors: f.colors,
    colorNames: f.colorNames,
    credits: creditsBySlug.get(f.slug) ?? [],
  }));
}
