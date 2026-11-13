/**
 * Flag generator. Reads the upstream flag repositories, validates, optimizes
 * and emits the thesvg flag entries. Never edit the outputs by hand.
 *
 * Usage:
 *   node scripts/flags/generate-flags.mjs --fi <flag-icons dir> --cf <circle-flags dir>
 *     [--ref <dir whose node_modules has i18n-iso-countries, cldr-core, svgo, @resvg/resvg-js>] (default packages/flags)
 *     [--root <output root>] (default: this repository)
 *     [--only us,de]         (restrict to these codes, used by tests)
 *     [--report <file>]      (write a JSON list of flags whose files changed)
 *
 * Everything is staged in memory first. If any check fails the process exits
 * non-zero and not a single checked-in file is touched.
 *
 * Outputs (under the root):
 *   public/icons/flag-<code>/{default,square,circle}.svg
 *   src/data/icons.json  (flag entries merged, sorted by slug)
 *   packages/flags/src/data/flags.json and flags.generated.ts  (metadata)
 *   packages/flags/src/data/licenses.json  (per-file provenance manifest)
 *   THIRD_PARTY_NOTICES.md and the marker blocks in the docs
 *
 * Environment: FLAGS_ACCESS_DATE, FLAGS_MIN_COUNT, FLAG_MAX_SVG_BYTES,
 * FLAG_PALETTE_MAX, FLAG_COLOR_TOLERANCE, FLAG_COLOR_MIN_SHARE.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { familyOf, hexOf } from "./colors.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const ROOT = resolve(args.root ?? repoRoot);
const REF = resolve(args.ref ?? join(repoRoot, "packages/flags"));
const ONLY = args.only ? new Set(args.only.split(",").map((s) => s.trim().toLowerCase())) : null;
if (!args.fi || !args.cf) {
  console.error("usage: generate-flags.mjs --fi <flag-icons dir> --cf <circle-flags dir>");
  process.exit(2);
}
const FI = resolve(args.fi);
const CF = resolve(args.cf);

const env = (k, d) => (process.env[k] !== undefined ? Number(process.env[k]) : d);
const LIMIT = env("FLAG_MAX_SVG_BYTES", 50 * 1024);
const PALETTE_MAX = env("FLAG_PALETTE_MAX", 6);
const COLOR_TOLERANCE = env("FLAG_COLOR_TOLERANCE", 28);
const COLOR_MIN_SHARE = env("FLAG_COLOR_MIN_SHARE", 0.02);
const MIN_COUNT = ONLY ? ONLY.size : env("FLAGS_MIN_COUNT", 258);

const refRequire = createRequire(join(REF, "package.json"));
const isoCountries = refRequire("i18n-iso-countries");
const { optimize } = refRequire("svgo"); // 3.3.5, the version svgo.yml checks with
const { Resvg } = refRequire("@resvg/resvg-js");
const cldrDir = dirname(refRequire.resolve("cldr-core/package.json"));
const territoryInfo = JSON.parse(readFileSync(join(cldrDir, "supplemental/territoryInfo.json"), "utf8")).supplemental.territoryInfo;
const svgoConfig = (await import(join(repoRoot, "svgo.config.mjs"))).default;

const rd = (p) => readFileSync(p, "utf8");
const gitRev = (dir) => execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const prior = (rel) => (existsSync(join(ROOT, rel)) ? JSON.parse(rd(join(ROOT, rel))) : null);
const priorLicenses = prior("packages/flags/src/data/licenses.json");
const today = process.env.FLAGS_ACCESS_DATE ?? new Date().toISOString().slice(0, 10);

const mkSource = (key, url, dir, holder, license, versionFile) => {
  const commit = gitRev(dir);
  const old = priorLicenses?.sources?.[key];
  return {
    url, commit, version: versionFile ? JSON.parse(rd(join(dir, versionFile))).version : "main", license, holder,
    // Keep the original access date while the pinned commit is unchanged, so reruns are byte-identical.
    accessed: old && old.commit === commit ? old.accessed : today,
  };
};
const SOURCES = {
  "flag-icons": mkSource("flag-icons", "https://github.com/lipis/flag-icons", FI, "Copyright (c) 2013 Panayiotis Lipiridis", "MIT", "package.json"),
  "circle-flags": mkSource("circle-flags", "https://github.com/HatScripts/circle-flags", CF, "Copyright (c) 2026 HatScripts", "MIT"),
};
if (args.commons) {
  // Files are public domain or CC0 per file; the list is filled in while building and verified against the Commons API when added.
  SOURCES["wikimedia-commons"] = { url: "https://commons.wikimedia.org", commit: null, version: "per file", license: "Public domain or CC0, per file", holder: "see the file list", accessed: priorLicenses?.sources?.["wikimedia-commons"]?.accessed ?? today, files: [] };
}
// A further source is added to SOURCES with its own license entry and a LICENSE file path here.
// A source used by any file but missing from either table aborts the run.
const SOURCE_LICENSE_FILES = { "flag-icons": [FI, "LICENSE"], "circle-flags": [CF, "LICENSE.md"] };

/** Extras beyond ISO 3166-1: key is the upstream file stem, value is the metadata. */
const EXTRAS = {
  "gb-eng": { name: "England", parent: "GB", languages: ["en"], kind: "subdivision" },
  "gb-sct": { name: "Scotland", parent: "GB", languages: ["en", "gd", "sco"], kind: "subdivision" },
  "gb-wls": { name: "Wales", parent: "GB", languages: ["cy", "en"], kind: "subdivision" },
  "es-ct": { name: "Catalonia", parent: "ES", languages: ["ca", "es", "oc"], kind: "subdivision", native: "Catalunya" },
  "es-pv": { name: "Basque Country", parent: "ES", languages: ["eu", "es"], kind: "subdivision", native: "Euskadi" },
  "es-ga": { name: "Galicia", parent: "ES", languages: ["gl", "es"], kind: "subdivision", native: "Galicia" },
  "es-vc": { name: "Valencian Community", parent: "ES", languages: ["ca", "es"], kind: "subdivision", native: "Comunitat Valenciana", localeTag: "ca-ES-valencia", files: { default: { commons: { file: "valencia.svg", title: "Flag of the Land of Valencia (official).svg", author: "Mutxamel and others", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:Flag_of_the_Land_of_Valencia_(official).svg" } } } },
  "es-ib": { name: "Balearic Islands", parent: "ES", languages: ["ca", "es"], kind: "subdivision", native: "Illes Balears", files: { default: { commons: { file: "balearic.svg", title: "Flag of the Balearic Islands.svg", author: "see file page", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:Flag_of_the_Balearic_Islands.svg" } } } },
  "es-cn": { name: "Canary Islands", parent: "ES", languages: ["es"], kind: "subdivision", native: "Canarias", files: { default: { stem: "ic" }, square: { stem: "ic" } } },
  "fr-cor": { name: "Corsica", parent: "FR", languages: ["co", "fr"], kind: "subdivision", native: "Corsica", files: { default: { commons: { file: "corsica.svg", title: "Flag of Corsica.svg", author: "Patricia.fidi", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:Flag_of_Corsica.svg" } }, circle: { stem: "fr-20r" } } },
  occitania: { name: "Occitania", parent: "FR", languages: ["oc", "fr"], kind: "region", native: "Occitania", files: { default: { commons: { file: "occitania.svg", title: "Flag of Occitania (with star).svg", author: "Nimlar and others", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:Flag_of_Occitania_(with_star).svg" } } } },
  eu: { name: "European Union", official: "European Union", languages: ["bg", "hr", "cs", "da", "nl", "en", "et", "fi", "fr", "de", "el", "hu", "ga", "it", "lv", "lt", "mt", "pl", "pt", "ro", "sk", "sl", "es", "sv"], kind: "organization" },
  un: { name: "United Nations", official: "United Nations", languages: ["ar", "zh", "en", "fr", "ru", "es"], kind: "organization" },
};

// Flags whose official coat of arms is too detailed to fit the 50KB icon limit without visible loss.
// Keep in sync with EXEMPT.size in scripts/validate-icons.ts (a test enforces it).
const OVERSIZE_OK = new Set(["bo", "rs"]);
const FIDELITY_MAX = env("FLAG_FIDELITY_MAX", 0.005); // mean absolute pixel difference at 256px, 0 to 1

const EXCLUDED = [
  ["an, su, yu, cs, zz and other retired ISO codes", "Historical states, not current ISO 3166-1 entries."],
  ["ac, cp, dg, ea, ic, ta, cq, fx", "Exceptionally reserved or transitional codes, not assigned country flags."],
  ["gb-nir", "No official current flag for Northern Ireland; the Ulster Banner is a contested symbol."],
  ["Disputed or unrecognized entities (Artsakh, Somaliland, Transnistria, Northern Cyprus, South Ossetia, Sealand, Donetsk and Luhansk, etc.)", "Politically contested; not in the ISO list. Left out beyond what the ISO list and Kosovo (user-assigned code XK, widely used) require."],
  ["Historical, ethnic, LGBT, pirate, sports and novelty flags in the sources", "Out of scope: a country and region flag category only."],
  ["Per-state and per-province subdivision flags (US states, Australian states, Indian states, etc.)", "Out of scope for this release; may come later as a separate collection."],
  ["fr-bre (Brittany)", "circle-flags has it, but the only rectangle source on Commons is CC BY-SA 4.0, which this catalog does not use; a circle-only flag would need a missing-variant path everywhere, so it is skipped for now."],
  ["Sardinia, Sicily and other Italian regions", "circle-flags it-* files are not mapped confidently to regions yet."],
  ["Language flags in circle-flags/language", "A flag represents a country, not a language."],
  ["Wikimedia Commons flag SVGs", "Not bundled: per-file license review required; used only as a manual cross-check reference, nothing copied."],
];

// ---------------------------------------------------------------------------
// Text normalization. Mirrored by `squash` in packages/flags/src/index.ts; a test keeps them in step.
// ---------------------------------------------------------------------------
const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\s'.,()&\-’]+$/u;
const norm = (s) => {
  let t = s.normalize("NFKC").toLowerCase();
  if (LATIN_ONLY.test(t)) t = t.normalize("NFKD").replace(/\p{M}/gu, "");
  return t.replace(/[^\p{L}\p{N}\p{M}\s'.]/gu, " ").replace(/['.]/g, "").replace(/\s+/g, " ").trim();
};

const emojiFor = (code) => [...code.toUpperCase()].map((ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65)).join("");
const TAG_EMOJI = { "gb-eng": "gbeng", "gb-sct": "gbsct", "gb-wls": "gbwls" };
const tagEmoji = (tags) => "\u{1F3F4}" + [...tags].map((ch) => String.fromCodePoint(0xe0000 + ch.charCodeAt(0))).join("") + "\u{E007F}";

const curated = JSON.parse(rd(join(here, "flag-aliases.json")));
delete curated._note;

const regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
const LOCALE_NAME_LANGS = ["de", "es", "fr", "pt", "ja", "zh", "ar", "hi", "ru", "ko", "it", "nl", "pl", "tr", "id"];

const langsFor = (code) => {
  const info = territoryInfo[code]?.languagePopulation ?? {};
  const rows = Object.entries(info).map(([lang, v]) => ({ lang: lang.split("_")[0], official: Boolean(v._officialStatus), pop: Number(v._populationPercent) }));
  rows.sort((a, b) => Number(b.official) - Number(a.official) || b.pop - a.pop || (a.lang < b.lang ? -1 : 1));
  const out = [];
  for (const r of rows) if ((r.official || r.pop >= 25) && !out.includes(r.lang)) out.push(r.lang);
  return out;
};

// ---------------------------------------------------------------------------
// Colors: rasterize once at a small size, cluster, classify. Deterministic: sorted ties, no randomness.
// ---------------------------------------------------------------------------
const palette = (svg) => {
  const img = new Resvg(svg, { fitTo: { mode: "width", value: 96 } }).render();
  const px = img.pixels;
  const exact = new Map();
  let total = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 250) continue;
    const k = hexOf(px[i], px[i + 1], px[i + 2]);
    exact.set(k, (exact.get(k) ?? 0) + 1);
    total++;
  }
  if (total === 0) return [];
  const order = [...exact.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const clusters = [];
  for (const [hex, n] of order) {
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const hit = clusters.find((c) => Math.hypot(rgb[0] - c.rgb[0], rgb[1] - c.rgb[1], rgb[2] - c.rgb[2]) <= COLOR_TOLERANCE);
    if (hit) hit.n += n;
    else clusters.push({ hex, rgb, n });
  }
  return clusters
    .filter((c) => c.n / total >= COLOR_MIN_SHARE)
    .sort((a, b) => b.n - a.n || (a.hex < b.hex ? -1 : 1))
    .slice(0, PALETTE_MAX)
    .map((c) => ({ hex: c.hex, share: Math.round((c.n / total) * 100) }));
};

// ---------------------------------------------------------------------------
// SVG processing: no title, desc, metadata or comments; output is a fixpoint of the repo svgo config.
// ---------------------------------------------------------------------------
const problems = [];
const prep = (svg) =>
  svg.replace(/<\?xml[^>]*>/g, "").replace(/<!DOCTYPE[^>]*>/g, "").trim()
    .replace(/<svg\b([^>]*)>/, (m, a) => `<svg${a.replace(/\s(width|height|id)="[^"]*"/g, "")}>`);
const raster = (svg) => new Resvg(svg, { fitTo: { mode: "width", value: 256 }, background: "#ffffff" }).render().pixels;
const pixelDiff = (a, b) => { const A = raster(a), B = raster(b); let t = 0; for (let i = 0; i < A.length; i++) t += Math.abs(A[i] - B[i]); return t / A.length / 255; };
/** Stronger settings for files over the size limit: whole-unit path precision with transforms baked in, kept only if the render stays within FIDELITY_MAX. */
const COMPACT = ["moveGroupAttrsToElems", { name: "convertPathData", params: { floatPrecision: 0, applyTransforms: true, transformPrecision: 4 } }, "mergePaths"];
const sizeReport = [];
const optimizeSvg = (svg, label) => {
  const base = optimizeSvgOnce(svg, label);
  if (Buffer.byteLength(base) <= LIMIT) return base;
  const compact = optimize(base, { multipass: true, plugins: [{ name: "preset-default", params: { overrides: { removeViewBox: false, removeTitle: false } } }, ...COMPACT] }).data;
  const out = optimize(compact, { multipass: true, ...svgoConfig }).data;
  const d = pixelDiff(base, out);
  sizeReport.push({ file: label, before: Buffer.byteLength(base), after: Buffer.byteLength(out), diff: Number(d.toFixed(5)) });
  if (d > FIDELITY_MAX) { problems.push(`${label}: compaction changes the render by ${d.toFixed(4)} (max ${FIDELITY_MAX}); keeping the original`); return base; }
  if (optimize(out, { multipass: true, ...svgoConfig }).data !== out) problems.push(`${label}: compacted output is not a fixpoint`);
  return out;
};
const optimizeSvgOnce = (svg, label) => {
  const first = optimize(prep(svg), { multipass: true, plugins: [...svgoConfig.plugins, "removeTitle", "removeDesc", "removeMetadata", "removeComments", "removeDimensions"] }).data;
  const out = optimize(first, { multipass: true, ...svgoConfig }).data;
  if (optimize(out, { multipass: true, ...svgoConfig }).data !== out) problems.push(`${label}: svgo output is not a fixpoint`);
  return out;
};
const circleFrom1x1 = (svg) => {
  const m = prep(svg).match(/<svg\b[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/);
  const [, vb, inner] = m;
  const [, , w, h] = vb.split(/\s+/).map(Number);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs><clipPath id="c"><circle cx="${w / 2}" cy="${h / 2}" r="${w / 2}"/></clipPath></defs><g clip-path="url(#c)">${inner}</g></svg>`;
};

// ---------------------------------------------------------------------------
// Build everything in memory.
// ---------------------------------------------------------------------------
const alpha2 = Object.keys(isoCountries.getAlpha2Codes()).filter((c) => !ONLY || ONLY.has(c.toLowerCase())).sort();
const territories = alpha2.map((code) => ({ code: code.toLowerCase(), upper: code }));
for (const stem of Object.keys(EXTRAS)) if (!ONLY || ONLY.has(stem)) territories.push({ code: stem, upper: stem.toUpperCase(), extra: true });
if (ONLY && !alpha2.includes("XK") && ONLY.has("xk")) territories.push({ code: "xk", upper: "XK" });

const countryJsonPath = join(FI, "country.json");
const fiCountries = existsSync(countryJsonPath) ? JSON.parse(rd(countryJsonPath)) : [];
const writes = new Map(); // path relative to ROOT -> string
const flags = [];
const entries = [];
const licenses = [];
const priorIcons = prior("src/data/icons.json") ?? [];
const priorDate = new Map(priorIcons.filter((i) => i.collection === "flags").map((i) => [i.slug, i.dateAdded]));

// ---------------------------------------------------------------------------
// Per-variant sources. A flag that is not in the default sources lists them in EXTRAS[code].files.
// ---------------------------------------------------------------------------
const ALLOWED_FILE_LICENSES = new Set(["Public domain", "CC0", "MIT", "Apache-2.0"]);
const COMMONS_DIR = args.commons ? resolve(args.commons) : null;
const commonsUsed = [];
const viewBoxOf = (svg) => {
  const vb = svg.match(/viewBox="([^"]+)"/)?.[1];
  if (vb) return vb.trim().split(/[\s,]+/).map(Number);
  const w = parseFloat(svg.match(/<svg\b[^>]*\swidth="([\d.]+)/)?.[1]);
  const h = parseFloat(svg.match(/<svg\b[^>]*\sheight="([\d.]+)/)?.[1]);
  return Number.isFinite(w) && Number.isFinite(h) ? [0, 0, w, h] : null;
};
const withViewBox = (svg, [x, y, w, h]) => svg.replace(/<svg\b([^>]*)>/, (m, a) => `<svg${a.replace(/\sviewBox="[^"]*"/, "").replace(/\s(width|height)="[^"]*"/g, "")} viewBox="${x} ${y} ${w} ${h}">`);
/** 4:3 frame without distortion: pad the short side with empty space, centered. */
const to4x3 = (svg) => {
  const [x, y, w, h] = viewBoxOf(svg);
  if (w / h > 4 / 3) { const h2 = (w * 3) / 4; return withViewBox(svg, [x, y - (h2 - h) / 2, w, h2]); }
  const w2 = (h * 4) / 3;
  return withViewBox(svg, [x - (w2 - w) / 2, y, w2, h]);
};
/** 1x1 the way flag-icons does it: center crop of the flag. */
const toSquare = (svg) => {
  const [x, y, w, h] = viewBoxOf(svg);
  return w >= h ? withViewBox(svg, [x + (w - h) / 2, y, h, h]) : withViewBox(svg, [x, y + (h - w) / 2, w, w]);
};
function planFor(code, extra) {
  const files = extra?.files;
  const fi = (kind, stem) => {
    const f = join(FI, "flags", kind, `${stem}.svg`);
    if (!existsSync(f)) { problems.push(`missing flag-icons file for ${code}`); return null; }
    return { svg: rd(f), source: "flag-icons", upstream: `flags/${kind}/${stem}.svg` };
  };
  const cf = (stem) => {
    const f = join(CF, "flags", `${stem}.svg`);
    return existsSync(f) ? { svg: rd(f), source: "circle-flags", upstream: `flags/${stem}.svg` } : null;
  };
  const commons = (spec) => {
    if (!COMMONS_DIR || !existsSync(join(COMMONS_DIR, spec.file))) { problems.push(`missing Wikimedia Commons file ${spec.file} for ${code}`); return null; }
    commonsUsed.push(spec);
    return { svg: rd(join(COMMONS_DIR, spec.file)), source: "wikimedia-commons", upstream: spec.title, license: spec.license };
  };
  let def, sq, circ;
  if (files?.default?.commons) {
    const c = commons(files.default.commons);
    if (!c) return null;
    def = { ...c, svg: to4x3(c.svg) };
    sq = { ...c, svg: toSquare(c.svg), upstream: `${c.upstream} (center crop)` };
  } else {
    def = fi("4x3", files?.default?.stem ?? code);
    sq = fi("1x1", files?.square?.stem ?? code);
  }
  circ = cf(files?.circle?.stem ?? code);
  if (!def || !sq) return null;
  if (!circ) circ = { svg: circleFrom1x1(sq.svg), source: sq.source, upstream: `derived from ${sq.upstream}`, license: sq.license };
  return { default: def, square: sq, circle: circ };
}

for (const t of territories) {
  const stem = t.code;
  const extra = EXTRAS[t.code];
  const name = extra ? extra.name : regionNames.of(t.upper)?.replace(/ SAR China$/, "").replace(/ & /g, " and ");
  if (!name) { problems.push(`no name for ${t.code}`); continue; }
  const allNames = extra ? [] : (isoCountries.getName(t.upper, "en", { select: "all" }) ?? []);
  const slug = `flag-${t.code}`;

  // Where each variant comes from. Default: flag-icons 4x3 and 1x1, circle-flags circle (or a crop of the 1x1).
  const plan = planFor(t.code, extra);
  if (!plan) continue;
  const svgs = {
    default: optimizeSvg(plan.default.svg, `${slug}/default`),
    square: optimizeSvg(plan.square.svg, `${slug}/square`),
    circle: optimizeSvg(plan.circle.svg, `${slug}/circle`),
  };
  const variants = {};
  for (const [v, svg] of Object.entries(svgs)) {
    if (!/viewBox="/.test(svg)) problems.push(`${slug}/${v}: missing viewBox`);
    if (/<script|<image|onload=|javascript:|<foreignObject|<!--|<metadata|<desc|<title/i.test(svg)) problems.push(`${slug}/${v}: unsafe or credit content`);
    if (Buffer.byteLength(svg) > LIMIT && !(OVERSIZE_OK.has(t.code) && v !== "circle")) problems.push(`${slug}/${v}: over limit (${Buffer.byteLength(svg)})`);
    writes.set(`public/icons/${slug}/${v}.svg`, svg); // no trailing newline: matches what the svgo workflow writes
    variants[v] = `/icons/${slug}/${v}.svg`;
    const { source, upstream, license } = plan[v];
    if (!SOURCES[source] || (!SOURCE_LICENSE_FILES[source] && source !== "wikimedia-commons")) problems.push(`${slug}/${v}: source ${source} has no license entry`);
    if (source === "wikimedia-commons" && !ALLOWED_FILE_LICENSES.has(license)) problems.push(`${slug}/${v}: license "${license}" is not accepted`);
    licenses.push({ file: `public/icons/${slug}/${v}.svg`, slug, variant: v, source, upstream, license: license ?? SOURCES[source]?.license ?? "UNKNOWN" });
  }

  const colors = palette(svgs.default);
  const dominant = colors.find((c) => familyOf(c.hex) !== "white") ?? colors[0];
  const hex = dominant?.hex ?? "808080";
  const families = [];
  for (const c of colors) { const f = familyOf(c.hex); if (c.share >= 5 && !families.includes(f)) families.push(f); }
  const top3 = colors.slice(0, 3);
  const tricolor = top3.length === 3 && top3.every((c) => c.share >= 25 && c.share <= 40) && top3.reduce((n, c) => n + c.share, 0) >= 90;

  const langs = extra ? extra.languages : langsFor(t.upper);
  const native = extra?.native ?? (() => {
    for (const l of langs) {
      if (l === "en") continue;
      try { const n = isoCountries.getName(t.upper, l); if (n && n !== name) return n; } catch { /* locale unavailable */ }
    }
    return undefined;
  })();
  const locales = extra?.kind === "organization" ? [] : extra ? [...(extra.localeTag ? [extra.localeTag] : []), ...langs.map((l) => `${l}-${extra.parent}-${(t.code.includes("-") ? t.code.split("-")[1] : t.code).toUpperCase()}`)] : langs.map((l) => `${l}-${t.upper}`);
  const emoji = TAG_EMOJI[t.code] ? tagEmoji(TAG_EMOJI[t.code]) : extra ? "" : emojiFor(t.code);
  const alpha3 = extra ? undefined : t.code === "xk" ? "XKX" : isoCountries.alpha2ToAlpha3(t.upper);
  const numeric = extra || t.code === "xk" ? undefined : isoCountries.alpha2ToNumeric(t.upper);
  const fiMeta = fiCountries.find((c) => c.code === stem);

  const localized = [];
  if (!extra) for (const l of LOCALE_NAME_LANGS) { try { const n = isoCountries.getName(t.upper, l); if (n) localized.push(n); } catch { /* locale unavailable */ } }
  const aliasSet = new Set();
  for (const a of [name, ...allNames, native, ...localized, ...(curated[t.code] ?? []), t.code, alpha3, numeric, emoji]) if (a) aliasSet.add(String(a));
  const colorTerms = [...families, ...colors.map((c) => c.hex), ...(tricolor ? ["tricolor", "tricolour"] : [])];
  const terms = [...new Set([...locales.map((l) => l.toLowerCase()), ...[...aliasSet].map((a) => (/[\u{1F1E6}-\u{1F1FF}\u{1F3F4}]/u.test(a) ? a : norm(a))), ...colorTerms].filter(Boolean))];
  const kind = extra ? extra.kind : t.code === "xk" ? "user-assigned" : "iso";
  const meta = {
    slug, code: t.code, iso: extra ? null : t.upper, alpha3: alpha3 ?? null, numeric: numeric ?? null, name, official: extra?.official ?? allNames[0] ?? name,
    native: native ?? null, emoji: emoji || null, kind, parent: extra?.parent ?? null, continent: fiMeta?.continent ?? null, capital: fiMeta?.capital ?? null,
    languages: langs, flagOf: locales, aliases: terms.filter((a) => a !== norm(name)),
    colors, colorNames: families, variants: ["default", "square", "circle"],
  };
  flags.push(meta);
  entries.push({
    slug, title: name, aliases: meta.aliases, hex, categories: ["Flags"], variants, license: "MIT",
    url: SOURCES["flag-icons"].url, collection: "flags", dateAdded: priorDate.get(slug) ?? today,
    collectionMeta: { type: "flag", kind, ...(meta.iso ? { iso: meta.iso } : {}), colors: colors.map((c) => `${c.hex}:${c.share}`), colorNames: families },
  });
}

if (SOURCES["wikimedia-commons"]) {
  const seen = new Map(commonsUsed.map((c) => [c.file, c]));
  SOURCES["wikimedia-commons"].files = [...seen.values()].sort((a, b) => (a.title < b.title ? -1 : 1)).map(({ title, author, license, url }) => ({ title, author, license, url }));
}

// Cross-checks: every ISO alpha-2 present, counts at or above the floor.
const have = new Set(flags.map((f) => f.iso).filter(Boolean));
for (const c of alpha2) if (!have.has(c)) problems.push(`ISO code missing: ${c}`);
if (flags.length < MIN_COUNT) problems.push(`flag count ${flags.length} is below the floor ${MIN_COUNT}`);
if (problems.length > 0) {
  console.error(JSON.stringify({ aborted: true, problems }, null, 2));
  process.exit(1);
}

flags.sort((a, b) => (a.slug < b.slug ? -1 : 1));
const cmp = (a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
const rest = priorIcons.filter((i) => !i.slug.startsWith("flag-"));
const sortedBefore = rest.every((x, i) => i === 0 || cmp(rest[i - 1], x) <= 0);
const merged = [...rest];
if (sortedBefore) { merged.push(...entries); merged.sort(cmp); }
else for (const e of entries) { const idx = merged.findIndex((x) => cmp(x, e) > 0); merged.splice(idx === -1 ? merged.length : idx, 0, e); }
writes.set("src/data/icons.json", JSON.stringify(merged, null, 2) + "\n");

const dataDir = "packages/flags/src/data";
writes.set(`${dataDir}/flags.json`, JSON.stringify({ generatedFrom: SOURCES, flags }, null, 2) + "\n");
writes.set(`${dataDir}/flags.generated.ts`, `// Generated by scripts/flags/generate-flags.mjs. Do not edit by hand.\nimport type { FlagMeta } from "../types.js";\n\nexport const FLAGS: readonly FlagMeta[] = ${JSON.stringify(flags, null, 2)};\n`);
writes.set(`${dataDir}/flag-names.generated.ts`, `// Generated by scripts/flags/generate-flags.mjs. Do not edit by hand.\n// Code to English name only, so the locale helper stays small.\nexport const FLAG_NAMES: Readonly<Record<string, string>> = ${JSON.stringify(Object.fromEntries(flags.map((f) => [f.code, f.name])), null, 2)};\n`);
// Loaded by the flag browser only when someone first searches; keeps the aliases out of the page bundle.
writes.set("public/data/flags-search.json", JSON.stringify(Object.fromEntries(flags.map((f) => [f.code, f.aliases]))) + "\n");
writes.set(`${dataDir}/licenses.json`, JSON.stringify({ sources: SOURCES, excluded: EXCLUDED, files: licenses }, null, 2) + "\n");

const licenseText = ([dir, file]) => rd(join(dir, file)).trim();
const sourceBlocks = Object.entries(SOURCES).map(([key, s]) => key === "wikimedia-commons" ? `## wikimedia-commons (rectangle variants of a few regional flags)

- URL: ${s.url}
- License: public domain or CC0, per file, verified through the Commons API on ${s.accessed}. Neither requires attribution; the files are listed for transparency.

${s.files.map((f) => `- ${f.title} by ${f.author}, ${f.license}: ${f.url}`).join("\n")}
` : `## ${key}

- URL: ${s.url}
- Version: ${s.version}, commit ${s.commit}
- License: ${s.license}
- Accessed: ${s.accessed}

${licenseText(SOURCE_LICENSE_FILES[key])}
`).join("\n");
writes.set("THIRD_PARTY_NOTICES.md", `# Third-party notices

This file is generated by \`scripts/flags/generate-flags.mjs\`. Do not edit it by hand.

The flag artwork in \`public/icons/flag-*\` and in \`@thesvg/flags\` is derived from the open source projects below. Each is MIT licensed, which requires that the copyright notice and license text accompany copies of the software. They are reproduced here in full. The SVG files were optimized with SVGO; the artwork is otherwise unchanged and the files carry no credit text, so the notices live here and in \`packages/flags/src/data/licenses.json\`, which maps every file to its upstream path.

National flags are public symbols. The MIT license covers the SVG drawings in those repositories, not any right of a state or organization in its own emblem. See LEGAL.md and DISCLAIMER.md.

${sourceBlocks}
## Reference data used only to validate and label (not redistributed)

- i18n-iso-countries ${refRequire("i18n-iso-countries/package.json").version} (MIT): ISO 3166-1 alpha-2, alpha-3 and numeric codes and localized country names.
- Unicode CLDR via cldr-core ${refRequire("cldr-core/package.json").version} (Unicode License V3): territory languages.
- Wikimedia Commons files were used only where listed above; otherwise they were a manual cross-check.
`);

// Docs and READMEs: marker blocks are rewritten, never hand-edited.
const localePath = join(ROOT, "packages/flags/src/locale.ts");
const localeRows = existsSync(localePath)
  ? (() => { const s = rd(localePath); const i = s.indexOf("LOCALE_FLAGS"); return [...s.slice(i, s.indexOf("};", i)).matchAll(/^\s*"?([\w-]+)"?:\s*"([\w-]+)",?$/gm)]; })()
  : [];
const fmt = (n) => n.toLocaleString("en-US");
const floor100 = (n) => Math.floor(n / 100) * 100;
const marks = {
  count: String(flags.length),
  iso: String(have.size),
  extras: String(flags.length - have.size),
  files: String(licenses.length),
  "palette-max": String(PALETTE_MAX),
  "total-icons": `${fmt(floor100(merged.length))}+`,
  "total-variants": `${fmt(floor100(merged.reduce((n, i) => n + Object.keys(i.variants).length, 0)))}+`,
  "locale-table": "\n| Locale | Flag |\n| --- | --- |\n" + localeRows.map(([, l, c]) => `| \`${l}\` | \`flag-${c}\` |`).join("\n") + "\n",
};
for (const rel of ["README.md", "docs/flags.md", "docs/collections.md", "packages/flags/README.md"]) {
  const f = join(ROOT, rel);
  if (!existsSync(f)) continue;
  let text = rd(f);
  for (const [k, v] of Object.entries(marks)) {
    if (k === "locale-table" && localeRows.length === 0) continue;
    text = text.replace(new RegExp(`<!-- flags:${k} -->[\\s\\S]*?<!-- /flags:${k} -->`, "g"), `<!-- flags:${k} -->${v}<!-- /flags:${k} -->`);
  }
  writes.set(rel, text);
}

// PR body helper: a collapsible list grouped by continent, regenerated whenever the count changes.
const byContinent = new Map();
for (const f of flags) { const k = f.continent ?? (f.kind === "organization" ? "International" : "Regional"); (byContinent.get(k) ?? byContinent.set(k, []).get(k)).push(f); }
writes.set("packages/flags/FLAG_LIST.md", `<!-- flags-list:start -->\n<details>\n<summary>Flag list (${flags.length})</summary>\n\n${[...byContinent.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, list]) => `**${k}** (${list.length}): ${list.map((f) => `${f.name} (\`${f.slug}\`)`).join(", ")}`).join("\n\n")}\n\n</details>\n<!-- flags-list:end -->\n`);

// Commit: only now touch the tree.
const changed = [];
const iconsDir = join(ROOT, "public/icons");
if (existsSync(iconsDir)) for (const d of readdirSync(iconsDir)) if (d.startsWith("flag-") && !writes.has(`public/icons/${d}/default.svg`)) rmSync(join(iconsDir, d), { recursive: true });
for (const [rel, content] of [...writes.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
  const f = join(ROOT, rel);
  if (rel.startsWith("public/icons/flag-") && (!existsSync(f) || rd(f) !== content)) changed.push(rel.split("/")[2]);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, content);
}
if (args.report) writeFileSync(resolve(args.report), JSON.stringify([...new Set(changed)], null, 2) + "\n");

const digest = createHash("sha256").update([...writes.entries()].map(([k, v]) => k + v).join("")).digest("hex").slice(0, 12);
console.log(JSON.stringify({ flags: flags.length, iso: have.size, extras: flags.length - have.size, files: licenses.length, changedFlags: new Set(changed).size, digest, oversize: sizeReport }));
