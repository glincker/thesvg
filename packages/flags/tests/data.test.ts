import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import isoCountries from "i18n-iso-countries";

import { FLAGS } from "../src/data/flags.generated.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ICONS_DIR = join(ROOT, "public/icons");
const licenses = JSON.parse(readFileSync(join(ROOT, "packages/flags/src/data/licenses.json"), "utf8")) as {
  sources: Record<string, { url: string; commit: string; license: string; accessed: string }>;
  files: { file: string; source: string; license: string }[];
};
const VARIANTS = ["default", "square", "circle"] as const;
// Mirrors EXEMPT.size in scripts/validate-icons.ts.
const OVERSIZE = new Set(["bo", "rs"]);

test("every ISO 3166-1 alpha-2 code has a flag, plus Kosovo", () => {
  const have = new Set(FLAGS.map((f) => f.iso).filter(Boolean));
  const iso = Object.keys(isoCountries.getAlpha2Codes());
  assert.ok(iso.length >= 249);
  const missing = iso.filter((c) => !have.has(c));
  assert.deepEqual(missing, []);
  assert.ok(have.has("XK"));
});

test("required regional flags are present", () => {
  const codes = new Set(FLAGS.map((f) => f.code));
  for (const c of ["gb-eng", "gb-sct", "gb-wls", "es-ct", "es-pv", "es-ga", "eu", "un"]) assert.ok(codes.has(c), c);
});

test("slugs, codes and strong identifiers are unique", () => {
  const unique = (label: string, values: (string | null)[]): void => {
    const real = values.filter((v): v is string => Boolean(v));
    assert.equal(new Set(real).size, real.length, `duplicate ${label}`);
  };
  unique("slug", FLAGS.map((f) => f.slug));
  unique("code", FLAGS.map((f) => f.code));
  unique("alpha3", FLAGS.map((f) => f.alpha3));
  unique("numeric", FLAGS.map((f) => f.numeric));
  unique("emoji", FLAGS.map((f) => f.emoji));
  unique("name", FLAGS.map((f) => f.name));
  unique("locale tag", FLAGS.flatMap((f) => f.flagOf));
  for (const f of FLAGS) assert.match(f.slug, /^flag-[a-z]{2}(-[a-z]+)?$|^flag-(eu|un|xk)$/);
});

test("every flag has valid SVG in all three variants", () => {
  for (const f of FLAGS) {
    for (const v of VARIANTS) {
      const file = join(ICONS_DIR, f.slug, `${v}.svg`);
      assert.ok(existsSync(file), file);
      const svg = readFileSync(file, "utf8");
      assert.match(svg, /^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `${f.slug}/${v} root`);
      assert.match(svg, /viewBox="[\d. -]+"/, `${f.slug}/${v} viewBox`);
      assert.doesNotMatch(svg, /<title|<desc|<metadata|<!--/i, `${f.slug}/${v} carries no title, description, metadata or comments`);
      assert.doesNotMatch(svg, /flag-icons|circle-flags|lipis|hatscripts|copyright|licen[cs]e|\bMIT\b/i, `${f.slug}/${v} carries no credit text`);
      assert.doesNotMatch(svg, /<script|<image|<foreignObject|javascript:|\son\w+=|<\?xml|<!DOCTYPE/i, `${f.slug}/${v} unsafe`);
      assert.match(svg.trimEnd(), /<\/svg>$/);
      if (!(OVERSIZE.has(f.code) && v !== "circle")) assert.ok(Buffer.byteLength(svg) <= 50 * 1024, `${f.slug}/${v} size`);
    }
  }
});

test("shapes: circle and square are 1:1, default is 4:3", () => {
  for (const f of FLAGS) {
    const vb = (v: string): number[] => (readFileSync(join(ICONS_DIR, f.slug, `${v}.svg`), "utf8").match(/viewBox="([^"]+)"/)![1].split(" ").map(Number));
    const [, , w43, h43] = vb("default");
    assert.equal(w43 / h43, 4 / 3, `${f.slug} default`);
    for (const v of ["square", "circle"]) {
      const [, , w, h] = vb(v);
      assert.equal(w, h, `${f.slug} ${v}`);
    }
  }
});

test("the license manifest covers every flag file and nothing else", () => {
  const onDisk = readdirSync(ICONS_DIR).filter((d) => d.startsWith("flag-")).flatMap((d) => readdirSync(join(ICONS_DIR, d)).map((x) => `public/icons/${d}/${x}`)).sort();
  assert.deepEqual(licenses.files.map((x) => x.file).sort(), onDisk);
  assert.equal(onDisk.length, FLAGS.length * 3);
  for (const x of licenses.files) {
    assert.equal(x.license, "MIT");
    assert.ok(licenses.sources[x.source], x.source);
  }
  for (const s of Object.values(licenses.sources)) {
    assert.match(s.commit, /^[0-9a-f]{40}$/);
    assert.match(s.accessed, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(s.license, "MIT");
  }
  const notice = readFileSync(join(ROOT, "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const s of Object.values(licenses.sources)) assert.ok(notice.includes(s.url) && notice.includes(s.commit));
});

test("icons.json registry matches the flag metadata", () => {
  const icons = JSON.parse(readFileSync(join(ROOT, "src/data/icons.json"), "utf8")) as { slug: string; collection: string; categories: string[]; aliases: string[]; variants: Record<string, string> }[];
  const entries = icons.filter((i) => i.collection === "flags");
  assert.equal(entries.length, FLAGS.length);
  assert.deepEqual(icons.filter((i) => i.slug.startsWith("flag-")).length, FLAGS.length);
  for (const f of FLAGS) {
    const e = entries.find((i) => i.slug === f.slug);
    assert.ok(e, f.slug);
    assert.deepEqual(e.categories, ["Flags"]);
    assert.deepEqual(Object.keys(e.variants).sort(), ["circle", "default", "square"]);
    assert.deepEqual(e.aliases, f.aliases);
  }
  const slugs = icons.map((i) => i.slug);
  assert.deepEqual(slugs, [...slugs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
});

test("tricky flags: Switzerland and Vatican are square, Nepal is non-rectangular, names are labelled", () => {
  const byCode = new Map(FLAGS.map((f) => [f.code, f]));
  assert.equal(byCode.get("xk")?.kind, "user-assigned");
  assert.equal(byCode.get("tw")?.name, "Taiwan");
  assert.equal(byCode.get("ps")?.name, "Palestinian Territories");
  assert.equal(byCode.get("eh")?.name, "Western Sahara");
  for (const c of ["np", "ch", "va", "qa", "es", "hk", "mo"]) assert.ok(byCode.has(c), c);
});

test("size exemptions match in the generator, validate-icons and validate-svg.yml, and every other file fits", () => {
  const want = [...OVERSIZE].flatMap((c) => [`public/icons/flag-${c}/default.svg`, `public/icons/flag-${c}/square.svg`]).sort();
  const grab = (text: string): string[] => [...new Set([...text.matchAll(/public\/icons\/flag-[a-z-]+\/(?:default|square)\.svg/g)].map((m) => m[0]))].sort();
  assert.deepEqual(grab(readFileSync(join(ROOT, "scripts/validate-icons.ts"), "utf8")), want);
  assert.deepEqual(grab(readFileSync(join(ROOT, ".github/workflows/validate-svg.yml"), "utf8")), want);
  const generator = readFileSync(join(ROOT, "scripts/flags/generate-flags.mjs"), "utf8");
  assert.match(generator, new RegExp(`OVERSIZE_OK = new Set\\(\\[${[...OVERSIZE].map((c) => `"${c}"`).join(", ")}\\]\\)`));
});
