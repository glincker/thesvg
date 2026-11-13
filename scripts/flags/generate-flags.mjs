/**
 * Flag generator. Reads the upstream flag repositories, validates, optimizes
 * and emits the thesvg flag entries. Never edit the outputs by hand.
 *
 * Usage:
 *   node scripts/flags/generate-flags.mjs --fi <flag-icons dir> --cf <circle-flags dir> --ref <dir with node_modules/{i18n-iso-countries,cldr-core,svgo@3.3.5}>
 *
 * Outputs:
 *   public/icons/flag-<code>/{default,square,circle}.svg
 *   src/data/icons.json  (flag entries merged, sorted by slug)
 *   packages/flags/src/data/flags.json  (metadata, drives the package, docs, tests)
 *   packages/flags/src/data/flags.generated.ts  (same metadata as typed source for the package)
 *   packages/flags/src/data/licenses.json  (per-file provenance manifest)
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith("--") ? [...a, [v.slice(2), all[i + 1]]] : a), []));
const FI = resolve(args.fi);
const CF = resolve(args.cf);
const REF = resolve(args.ref);

const refRequire = createRequire(join(REF, "package.json"));
const isoCountries = refRequire("i18n-iso-countries");
const territoryInfo = JSON.parse(readFileSync(join(REF, "node_modules/cldr-core/supplemental/territoryInfo.json"), "utf8")).supplemental.territoryInfo;
// svgo 3.3.5 matches the version the svgo.yml workflow checks with.
const { optimize } = refRequire("svgo");
const svgoConfig = (await import(join(root, "svgo.config.mjs"))).default;

const gitRev = (dir) => execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const FI_REV = gitRev(FI);
const CF_REV = gitRev(CF);
const ACCESS_DATE = new Date().toISOString().slice(0, 10);

const SOURCES = {
  "flag-icons": { url: "https://github.com/lipis/flag-icons", commit: FI_REV, version: JSON.parse(readFileSync(join(FI, "package.json"), "utf8")).version, license: "MIT", holder: "Copyright (c) 2013 Panayiotis Lipiridis", accessed: ACCESS_DATE },
  "circle-flags": { url: "https://github.com/HatScripts/circle-flags", commit: CF_REV, version: "main", license: "MIT", holder: "Copyright (c) 2026 HatScripts", accessed: ACCESS_DATE },
};

/** Extras beyond ISO 3166-1: key is the upstream file stem, value is the metadata. */
const EXTRAS = {
  "gb-eng": { name: "England", parent: "GB", languages: ["en"], kind: "subdivision" },
  "gb-sct": { name: "Scotland", parent: "GB", languages: ["en", "gd", "sco"], kind: "subdivision" },
  "gb-wls": { name: "Wales", parent: "GB", languages: ["cy", "en"], kind: "subdivision" },
  "es-ct": { name: "Catalonia", parent: "ES", languages: ["ca", "es", "oc"], kind: "subdivision", native: "Catalunya" },
  "es-pv": { name: "Basque Country", parent: "ES", languages: ["eu", "es"], kind: "subdivision", native: "Euskadi" },
  "es-ga": { name: "Galicia", parent: "ES", languages: ["gl", "es"], kind: "subdivision", native: "Galicia" },
  eu: { name: "European Union", official: "European Union", languages: ["bg", "hr", "cs", "da", "nl", "en", "et", "fi", "fr", "de", "el", "hu", "ga", "it", "lv", "lt", "mt", "pl", "pt", "ro", "sk", "sl", "es", "sv"], kind: "organization" },
  un: { name: "United Nations", official: "United Nations", languages: ["ar", "zh", "en", "fr", "ru", "es"], kind: "organization" },
};
const UPSTREAM_STEM = {};

const EXCLUDED = [
  ["an, su, yu, cs, zz and other retired ISO codes", "Historical states, not current ISO 3166-1 entries."],
  ["ac, cp, dg, ea, ic, ta, cq, fx", "Exceptionally reserved or transitional codes, not assigned country flags."],
  ["gb-nir", "No official current flag for Northern Ireland; the Ulster Banner is a contested symbol."],
  ["Disputed or unrecognized entities (Artsakh, Somaliland, Transnistria, Northern Cyprus, South Ossetia, Sealand, Donetsk and Luhansk, etc.)", "Politically contested; not in the ISO list. Left out beyond what the ISO list and Kosovo (user-assigned code XK, widely used) require."],
  ["Historical, ethnic, LGBT, pirate, sports and novelty flags in the sources", "Out of scope: a country and region flag category only."],
  ["Per-state and per-province subdivision flags (US states, Australian states, Indian states, etc.)", "Out of scope for this release; may come later as a separate collection."],
  ["Language flags in circle-flags/language", "A flag represents a country, not a language."],
  ["Wikimedia Commons flag SVGs", "Not bundled: per-file license review required; used only as a manual cross-check reference, nothing copied."],
];

const emojiFor = (code) => {
  const c = code.toUpperCase();
  if (/^[A-Z]{2}$/.test(c) && c !== "XK" || c === "XK") return [...c].map((ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65)).join("");
  return "";
};
// Tag-sequence emoji exist only for the three home nations.
const TAG_EMOJI = { "gb-eng": "gbeng", "gb-sct": "gbsct", "gb-wls": "gbwls" };
const tagEmoji = (tags) => "\u{1F3F4}" + [...tags].map((ch) => String.fromCodePoint(0xe0000 + ch.charCodeAt(0))).join("") + "\u{E007F}";

// Flags whose official coat of arms is too detailed to fit the 50KB icon limit without visible loss.
// Keep in sync with EXEMPT.size in scripts/validate-icons.ts (a test enforces it).
const OVERSIZE_OK = new Set(["bo", "es", "me", "mx", "rs", "sv"]);
const LIMIT = Number(process.env.FLAG_MAX_SVG_BYTES ?? 50 * 1024);
const norm = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s'.]/g, " ").replace(/['.]/g, "").replace(/\s+/g, " ").trim();

const curated = JSON.parse(readFileSync(join(here, "flag-aliases.json"), "utf8"));
delete curated._note;

// Brand-style accent for UI chrome: the most common saturated fill of the 4x3 file.
const NAMED = { red: "ff0000", green: "008000", blue: "0000ff", yellow: "ffff00", orange: "ffa500" };
const accentHex = (svg) => {
  const counts = new Map();
  for (const m of svg.matchAll(/fill="(#[0-9a-fA-F]{3,6}|[a-z]+)"/g)) {
    let h = m[1].startsWith("#") ? m[1].slice(1).toLowerCase() : NAMED[m[1]];
    if (!h) continue;
    if (h.length === 3) h = [...h].map((c) => c + c).join("");
    if (/^(f{6}|e{6}|0{6}|f8f8f8|eeeeee|fafafa)$/.test(h)) continue;
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? "808080";
};

const langsFor = (code) => {
  const info = territoryInfo[code]?.languagePopulation ?? {};
  const rows = Object.entries(info).map(([lang, v]) => ({ lang: lang.split("_")[0], official: Boolean(v._officialStatus), pop: Number(v._populationPercent) }));
  rows.sort((a, b) => Number(b.official) - Number(a.official) || b.pop - a.pop);
  const out = [];
  for (const r of rows) if ((r.official || r.pop >= 25) && !out.includes(r.lang)) out.push(r.lang);
  return out;
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
const alpha2 = Object.keys(isoCountries.getAlpha2Codes()).sort();
const territories = alpha2.map((code) => ({ code: code.toLowerCase(), upper: code, extra: false }));
for (const stem of Object.keys(EXTRAS)) territories.push({ code: stem, upper: stem.toUpperCase(), extra: true });

const problems = [];
const stripWrapper = (svg) => svg.replace(/<\?xml[^>]*>/g, "").replace(/<!DOCTYPE[^>]*>/g, "");

const opt = (svg, prefix, title) => {
  let s = stripWrapper(svg).trim();
  s = s.replace(/<svg\b([^>]*)>/, (m, a) => `<svg${a.replace(/\s(width|height)="[^"]*"/g, "")}><title>${title}</title>`);
  s = s.replace(/<svg\b([^>]*?)\sid="[^"]*"/, "<svg$1");
  // Detailed coats of arms can exceed the 50KB icon limit; lower path precision stepwise until they fit.
  let out = "";
  for (const floatPrecision of [3, 2, 1]) {
    const plugins = [{ name: "preset-default", params: { floatPrecision, overrides: { removeViewBox: false, removeTitle: false } } }, { name: "prefixIds", params: { prefix, delim: "-" } }, "removeDimensions"];
    out = optimize(s, { multipass: true, plugins }).data;
    if (Buffer.byteLength(out) <= LIMIT) break;
  }
  return out;
};

const circleFrom1x1 = (svg, prefix) => {
  const m = stripWrapper(svg).match(/<svg\b[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/);
  const [, vb, inner] = m;
  const [, , w, h] = vb.split(/\s+/).map(Number);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs><clipPath id="c"><circle cx="${w / 2}" cy="${h / 2}" r="${w / 2}"/></clipPath></defs><g clip-path="url(#c)">${inner}</g></svg>`;
};

const flags = [];
const entries = [];
const licenses = [];
const derivedCircle = [];
const outRoot = join(root, "public/icons");
for (const d of readdirSync(outRoot)) if (d.startsWith("flag-")) rmSync(join(outRoot, d), { recursive: true });

for (const t of territories) {
  const stem = UPSTREAM_STEM[t.code]?.fi ?? t.code;
  const p43 = join(FI, "flags/4x3", `${stem}.svg`);
  const p11 = join(FI, "flags/1x1", `${stem}.svg`);
  const pc = join(CF, "flags", `${UPSTREAM_STEM[t.code]?.cf ?? t.code}.svg`);
  if (!existsSync(p43) || !existsSync(p11)) { problems.push(`missing flag-icons file for ${t.code}`); continue; }
  const extra = EXTRAS[t.code];
  const name = extra ? extra.name : regionNames.of(t.upper).replace(/ SAR China$/, "").replace(/ & /g, " and ");
  if (!name) { problems.push(`no name for ${t.code}`); continue; }
  const allNames = extra ? [] : (isoCountries.getName(t.upper, "en", { select: "all" }) ?? []);
  const title = `Flag of ${name}`;
  const slug = `flag-${t.code}`;
  const dir = join(outRoot, slug);
  mkdirSync(dir, { recursive: true });

  const variantSvgs = {
    default: opt(readFileSync(p43, "utf8"), `${slug}-d`, title),
    square: opt(readFileSync(p11, "utf8"), `${slug}-s`, title),
  };
  let circleSrc = "";
  let circleFromCf = existsSync(pc);
  circleSrc = circleFromCf ? readFileSync(pc, "utf8") : circleFrom1x1(readFileSync(p11, "utf8"));
  if (!circleFromCf) derivedCircle.push(t.code);
  variantSvgs.circle = opt(circleSrc, `${slug}-c`, title);

  const variants = {};
  for (const [v, svg] of Object.entries(variantSvgs)) {
    if (!/viewBox="/.test(svg) || !/<title>/.test(svg)) problems.push(`${slug}/${v}: missing viewBox or title`);
    if (/<script|<image|onload=|javascript:|<foreignObject/i.test(svg)) problems.push(`${slug}/${v}: unsafe content`);
    if (Buffer.byteLength(svg) > LIMIT && !(OVERSIZE_OK.has(t.code) && v !== "circle")) problems.push(`${slug}/${v}: over limit (${Buffer.byteLength(svg)})`);
    writeFileSync(join(dir, `${v}.svg`), svg + "\n");
    variants[v] = `/icons/${slug}/${v}.svg`;
    const src = v === "circle" && circleFromCf ? "circle-flags" : "flag-icons";
    licenses.push({ file: `public/icons/${slug}/${v}.svg`, slug, variant: v, source: src, upstream: v === "default" ? `flags/4x3/${stem}.svg` : v === "square" ? `flags/1x1/${stem}.svg` : circleFromCf ? `flags/${UPSTREAM_STEM[t.code]?.cf ?? t.code}.svg` : `derived from flags/1x1/${stem}.svg`, license: "MIT" });
  }

  const langs = extra ? extra.languages : langsFor(t.upper);
  const parentUpper = extra?.parent;
  const native = extra?.native ?? (() => {
    if (extra) return undefined;
    for (const l of langs) {
      if (l === "en") continue;
      try { const n = isoCountries.getName(t.upper, l); if (n && n !== name) return n; } catch { /* locale unavailable */ }
    }
    return undefined;
  })();
  const locales = extra?.kind === "organization" ? [] : extra
    ? [...new Set(langs.map((l) => (parentUpper ? `${l}-${parentUpper}-${t.code.split("-")[1]?.toUpperCase() ?? t.code.toUpperCase()}` : l)))]
    : langs.map((l) => `${l}-${t.upper}`);
  const emoji = TAG_EMOJI[t.code] ? tagEmoji(TAG_EMOJI[t.code]) : extra ? "" : emojiFor(t.code);
  const alpha3 = extra ? undefined : t.code === "xk" ? "XKX" : isoCountries.alpha2ToAlpha3(t.upper);
  const numeric = extra ? undefined : t.code === "xk" ? undefined : isoCountries.alpha2ToNumeric(t.upper);
  const fiMeta = JSON.parse(readFileSync(join(FI, "country.json"), "utf8")).find((c) => c.code === stem);
  const aliasSet = new Set();
  for (const a of [name, ...allNames, native, ...(curated[t.code] ?? []), t.code, alpha3, numeric, emoji]) if (a) aliasSet.add(String(a));
  const localeTags = locales.map((l) => l.toLowerCase());
  const searchTerms = [...new Set([...localeTags, ...[...aliasSet].map((a) => (/[\u{1F1E6}-\u{1F1FF}\u{1F3F4}]/u.test(a) ? a : norm(a))).filter(Boolean)])];
  const kind = extra ? extra.kind : t.code === "xk" ? "user-assigned" : "iso";
  const meta = {
    slug, code: t.code, iso: extra ? null : t.upper, alpha3: alpha3 ?? null, numeric: numeric ?? null, name, official: extra?.official ?? allNames[0] ?? name,
    native: native ?? null, emoji: emoji || null, kind, parent: parentUpper ?? null, continent: fiMeta?.continent ?? null, capital: fiMeta?.capital ?? null,
    languages: langs, flagOf: locales, aliases: searchTerms.filter((a) => a !== norm(name)),
    variants: ["default", "square", "circle"],
  };
  flags.push(meta);
  entries.push({
    slug, title: name, aliases: meta.aliases, hex: accentHex(variantSvgs.default), categories: ["Flags"], variants, license: "MIT",
    url: SOURCES["flag-icons"].url, collection: "flags", dateAdded: ACCESS_DATE,
    collectionMeta: { type: "flag", kind, ...(meta.iso ? { iso: meta.iso } : {}) },
  });
}

// Cross-check: every ISO alpha-2 must be present.
const have = new Set(flags.map((f) => f.iso).filter(Boolean));
for (const c of alpha2) if (!have.has(c)) problems.push(`ISO code missing: ${c}`);

// Merge into icons.json, keeping slug order.
const iconsPath = join(root, "src/data/icons.json");
const all = JSON.parse(readFileSync(iconsPath, "utf8")).filter((i) => !i.slug.startsWith("flag-"));
const cmp = (a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
const sorted = all.every((x, i) => i === 0 || cmp(all[i - 1], x) <= 0);
const merged = [...all, ...entries];
if (sorted) merged.sort(cmp);
else {
  // Existing file is not strictly sorted: insert each flag before the first larger slug.
  merged.length = 0; merged.push(...all);
  for (const e of entries) { const idx = merged.findIndex((x) => cmp(x, e) > 0); merged.splice(idx === -1 ? merged.length : idx, 0, e); }
}
writeFileSync(iconsPath, JSON.stringify(merged, null, 2) + "\n");

flags.sort((a, b) => (a.slug < b.slug ? -1 : 1));
const dataDir = join(root, "packages/flags/src/data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "flags.json"), JSON.stringify({ generatedFrom: SOURCES, flags }, null, 2) + "\n");
writeFileSync(
  join(dataDir, "flags.generated.ts"),
  `// Generated by scripts/flags/generate-flags.mjs. Do not edit by hand.\nimport type { FlagMeta } from "../types.js";\n\nexport const FLAGS: readonly FlagMeta[] = ${JSON.stringify(flags, null, 2)};\n`,
);
writeFileSync(join(dataDir, "licenses.json"), JSON.stringify({ sources: SOURCES, excluded: EXCLUDED, files: licenses }, null, 2) + "\n");

const licenseText = (dir, file) => readFileSync(join(dir, file), "utf8").trim();
const notice = `# Third-party notices

This file is generated by \`scripts/flags/generate-flags.mjs\`. Do not edit it by hand.

The flag artwork in \`public/icons/flag-*\` and in \`@thesvg/flags\` is derived from the open source projects below. Both are MIT licensed, which requires that the copyright notice and license text accompany copies of the software. They are reproduced here in full. The SVG files were optimized with SVGO and given a \`<title>\`, and element ids were prefixed to avoid collisions; the artwork is otherwise unchanged. The per-file mapping is in \`packages/flags/src/data/licenses.json\`.

National flags are public symbols. The MIT license covers the SVG drawings in those repositories, not any right of a state or organization in its own emblem. See LEGAL.md and DISCLAIMER.md.

## flag-icons (4x3 and square variants)

- URL: ${SOURCES["flag-icons"].url}
- Version: ${SOURCES["flag-icons"].version}, commit ${FI_REV}
- License: MIT
- Accessed: ${ACCESS_DATE}

${licenseText(FI, "LICENSE")}

## circle-flags (circle variant)

- URL: ${SOURCES["circle-flags"].url}
- Commit: ${CF_REV}
- License: MIT
- Accessed: ${ACCESS_DATE}

${licenseText(CF, "LICENSE.md")}

## Reference data used only to validate and label (not redistributed)

- i18n-iso-countries ${refRequire("i18n-iso-countries/package.json").version} (MIT): ISO 3166-1 alpha-2, alpha-3 and numeric codes.
- Unicode CLDR via cldr-core ${refRequire("cldr-core/package.json").version} (Unicode License V3): territory languages.
- Wikimedia Commons national flag files were consulted manually as a cross-check only. Nothing was copied from them.
`;
writeFileSync(join(root, "THIRD_PARTY_NOTICES.md"), notice);

// Keep docs and READMEs in step with the metadata: marker blocks are rewritten, never hand-edited.
const localeSrc = readFileSync(join(root, "packages/flags/src/locale.ts"), "utf8");
const localeBody = localeSrc.slice(localeSrc.indexOf("LOCALE_FLAGS"), localeSrc.indexOf("};", localeSrc.indexOf("LOCALE_FLAGS")));
const localeRows = [...localeBody.matchAll(/^\s*"?([\w-]+)"?:\s*"([\w-]+)",?$/gm)];
const totalIcons = merged.length;
const totalVariants = merged.reduce((n, i) => n + Object.keys(i.variants).length, 0);
const floor100 = (n) => Math.floor(n / 100) * 100;
const fmt = (n) => n.toLocaleString("en-US");
const marks = {
  count: String(flags.length),
  iso: String(have.size),
  extras: String(flags.length - have.size),
  files: String(licenses.length),
  "total-icons": `${fmt(floor100(totalIcons))}+`,
  "total-variants": `${fmt(floor100(totalVariants))}+`,
  "locale-table": "\n| Locale | Flag |\n| --- | --- |\n" + localeRows.map(([, l, c]) => `| \`${l}\` | \`flag-${c}\` |`).join("\n") + "\n",
};
for (const rel of ["README.md", "docs/flags.md", "docs/collections.md", "packages/flags/README.md"]) {
  const f = join(root, rel);
  if (!existsSync(f)) continue;
  let text = readFileSync(f, "utf8");
  for (const [k, v] of Object.entries(marks)) text = text.replace(new RegExp(`<!-- flags:${k} -->[\\s\\S]*?<!-- /flags:${k} -->`, "g"), `<!-- flags:${k} -->${v}<!-- /flags:${k} -->`);
  writeFileSync(f, text);
}

console.log(JSON.stringify({ flags: flags.length, iso: have.size, extras: flags.length - have.size, files: licenses.length, derivedCircle, problems, sortedBefore: sorted }));
