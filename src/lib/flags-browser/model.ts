import { rankTerms, fold, squash } from "../../../packages/flags/src/rank";
import { FLAGS_COLOR_MIN_SHARE, FLAGS_COLOR_TOLERANCE_DEFAULT, FLAG_SIZES, type FlagSize } from "./config";
import { colorDistance, hexToRgb, hueSortKey, isHex } from "./color";

export type FlagVariantKey = "4x3" | "square" | "circle";
export type RegionId = "africa" | "americas" | "asia" | "europe" | "oceania" | "antarctica" | "regional" | "international";
export type SortKey = "name" | "region" | "iso" | "hue";
export type ColorMode = "or" | "and";
export type ViewMode = "flags" | "languages";

export interface FlagTile {
  code: string;
  slug: string;
  name: string;
  native: string | null;
  iso: string | null;
  alpha3: string | null;
  numeric: string | null;
  emoji: string | null;
  kind: string;
  region: RegionId;
  capital: string | null;
  languages: string[];
  flagOf: string[];
  colors: { hex: string; share: number }[];
  colorNames: string[];
}

export const REGIONS: { id: RegionId; label: string }[] = [
  { id: "africa", label: "Africa" },
  { id: "americas", label: "Americas" },
  { id: "asia", label: "Asia" },
  { id: "europe", label: "Europe" },
  { id: "oceania", label: "Oceania" },
  { id: "antarctica", label: "Antarctica" },
  { id: "regional", label: "Regional" },
  { id: "international", label: "International" },
];
export const COLOR_FAMILIES = ["red", "orange", "yellow", "gold", "green", "blue", "purple", "pink", "brown", "black", "white", "gray"] as const;

export function regionOf(continent: string | null, kind: string): RegionId {
  if (kind === "organization") return "international";
  if (kind === "subdivision" || kind === "region") return "regional";
  switch (continent) {
    case "Africa": return "africa";
    case "North America":
    case "South America": return "americas";
    case "Asia": return "asia";
    case "Europe": return "europe";
    case "Oceania": return "oceania";
    default: return "antarctica";
  }
}

export interface BrowserState {
  q: string;
  region: RegionId | "all";
  variant: FlagVariantKey;
  size: FlagSize;
  sort: SortKey;
  colors: string[];
  mode: ColorMode;
  near: string;
  tol: number;
  flag: string | null;
  view: ViewMode;
}

export const DEFAULT_STATE: BrowserState = {
  q: "", region: "all", variant: "4x3", size: "m", sort: "name", colors: [], mode: "or", near: "", tol: FLAGS_COLOR_TOLERANCE_DEFAULT, flag: null, view: "flags",
};

const oneOf = <T extends string>(v: string | null, allowed: readonly T[], fallback: T): T => (v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);

export function parseState(params: URLSearchParams, base: BrowserState = DEFAULT_STATE): BrowserState {
  const colors = (params.get("colors") ?? "").split(",").filter((c) => (COLOR_FAMILIES as readonly string[]).includes(c));
  const tol = Number(params.get("tol"));
  const near = params.get("near") ?? "";
  return {
    q: params.get("q") ?? base.q,
    region: oneOf(params.get("region"), [...REGIONS.map((r) => r.id), "all"] as const, base.region),
    variant: oneOf(params.get("variant"), ["4x3", "square", "circle"] as const, base.variant),
    size: oneOf(params.get("size"), Object.keys(FLAG_SIZES) as FlagSize[], base.size),
    sort: oneOf(params.get("sort"), ["name", "region", "iso", "hue"] as const, base.sort),
    colors: params.has("colors") ? colors : base.colors,
    mode: oneOf(params.get("mode"), ["or", "and"] as const, base.mode),
    near: isHex(near) ? near.replace(/^#/, "").toLowerCase() : base.near,
    tol: Number.isFinite(tol) && tol > 0 && tol <= 200 ? tol : base.tol,
    flag: params.get("flag") ?? base.flag,
    view: oneOf(params.get("view"), ["flags", "languages"] as const, base.view),
  };
}

/** Only values that differ from the defaults go in the URL, so shared links stay short. */
export function toParams(state: BrowserState): URLSearchParams {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.region !== DEFAULT_STATE.region) p.set("region", state.region);
  if (state.variant !== DEFAULT_STATE.variant) p.set("variant", state.variant);
  if (state.size !== DEFAULT_STATE.size) p.set("size", state.size);
  if (state.sort !== DEFAULT_STATE.sort) p.set("sort", state.sort);
  if (state.colors.length > 0) p.set("colors", state.colors.join(","));
  if (state.mode !== DEFAULT_STATE.mode) p.set("mode", state.mode);
  if (state.near) p.set("near", state.near);
  if (state.near && state.tol !== DEFAULT_STATE.tol) p.set("tol", String(state.tol));
  if (state.flag) p.set("flag", state.flag);
  if (state.view !== DEFAULT_STATE.view) p.set("view", state.view);
  return p;
}

/** Terms a tile is searched by before the alias file has loaded. */
export function tileTerms(t: FlagTile, aliases: readonly string[] = []): string[] {
  return [fold(t.name), t.native ? squash(t.native) : "", t.slug, t.code, t.iso?.toLowerCase() ?? "", t.alpha3?.toLowerCase() ?? "", t.numeric ?? "", t.emoji ?? "", ...t.flagOf.map((l) => l.toLowerCase()), ...aliases].filter(Boolean);
}

const REGION_ORDER = new Map(REGIONS.map((r, i) => [r.id, i]));

export function matchesColors(t: FlagTile, families: readonly string[], mode: ColorMode, near: string, tol: number): boolean {
  if (families.length > 0) {
    const present = new Set(t.colorNames);
    const ok = mode === "and" ? families.every((f) => present.has(f)) : families.some((f) => present.has(f));
    if (!ok) return false;
  }
  if (near && isHex(near)) {
    const target = hexToRgb(near);
    if (!t.colors.some((c) => c.share >= FLAGS_COLOR_MIN_SHARE && colorDistance(hexToRgb(c.hex), target) <= tol)) return false;
  }
  return true;
}

export function sortTiles<T extends FlagTile>(tiles: T[], sort: SortKey): T[] {
  const byName = (a: T, b: T): number => a.name.localeCompare(b.name);
  const dominant = (t: T): string => (t.colors.find((c) => !["ffffff"].includes(c.hex)) ?? t.colors[0])?.hex ?? "808080";
  const out = [...tiles];
  if (sort === "region") out.sort((a, b) => (REGION_ORDER.get(a.region)! - REGION_ORDER.get(b.region)!) || byName(a, b));
  else if (sort === "iso") out.sort((a, b) => (a.iso ?? `ZZZ${a.code}`).localeCompare(b.iso ?? `ZZZ${b.code}`));
  else if (sort === "hue") out.sort((a, b) => hueSortKey(dominant(a)) - hueSortKey(dominant(b)) || byName(a, b));
  else out.sort(byName);
  return out;
}

/** Apply search, region and color filters, then sort (relevance first when there is a query). */
export function filterTiles(tiles: readonly FlagTile[], state: BrowserState, aliases?: Readonly<Record<string, string[]>> | null): FlagTile[] {
  const q = state.q.trim();
  const ranked: { t: FlagTile; r: number }[] = [];
  for (const t of tiles) {
    if (state.region !== "all" && t.region !== state.region) continue;
    if (!matchesColors(t, state.colors, state.mode, state.near, state.tol)) continue;
    const r = q ? rankTerms(tileTerms(t, aliases?.[t.code]), q) : 0;
    if (r < 3) ranked.push({ t, r });
  }
  const sorted = sortTiles(ranked.map((x) => x.t), state.sort);
  if (!q) return sorted;
  const rank = new Map(ranked.map((x) => [x.t.code, x.r]));
  return sorted.sort((a, b) => rank.get(a.code)! - rank.get(b.code)!);
}
