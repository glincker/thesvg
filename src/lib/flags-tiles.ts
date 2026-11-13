import { FLAGS } from "../../packages/flags/src/data/flags.generated";
import { regionOf, type FlagTile } from "@/lib/flags-browser/model";

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
  }));
}
