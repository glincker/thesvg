import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FLAGS } from "../../../packages/flags/src/data/flags.generated";
import { LOCALE_FLAGS } from "../../../packages/flags/src/locale";
import { getAllIcons, getCollectionCount, getIconsByCollection, roundDownToHundred } from "@/lib/icons";
import { COLLECTION_IDS, COLLECTIONS_META } from "@/lib/collections-meta";
import { searchIcons } from "@/lib/search";

const ROOT = join(__dirname, "../../..");
const read = (rel: string): string => readFileSync(join(ROOT, rel), "utf8");
const marker = (text: string, key: string): string[] =>
  [...text.matchAll(new RegExp(`<!-- flags:${key} -->([\\s\\S]*?)<!-- /flags:${key} -->`, "g"))].map((m) => m[1]);

describe("flags collection", () => {
  it("is registered with metadata and matches the package data", () => {
    expect(COLLECTION_IDS).toContain("flags");
    expect(COLLECTIONS_META.flags.label).toBe("Country Flags");
    expect(getCollectionCount("flags")).toBe(FLAGS.length);
    for (const icon of getIconsByCollection("flags")) {
      expect(icon.categories).toEqual(["Flags"]);
      expect(Object.keys(icon.variants).sort()).toEqual(["circle", "default", "square"]);
    }
  });

  it("finds flags by many names through the site search", () => {
    const icons = getAllIcons();
    const lookups: [string, string][] = [
      ["deutschland", "flag-de"], ["DEU", "flag-de"], ["276", "flag-de"], ["holland", "flag-nl"],
      ["england", "flag-gb-eng"], ["catalunya", "flag-es-ct"], ["pt-BR", "flag-br"], ["\u{1F1E9}\u{1F1EA}", "flag-de"],
    ];
    for (const [query, slug] of lookups) {
      expect(searchIcons(icons, query).slice(0, 3).map((i) => i.slug), query).toContain(slug);
    }
  });

  it("exact identifiers resolve to exactly one flag", () => {
    for (const f of FLAGS) {
      for (const id of [f.alpha3, f.numeric, f.emoji, ...f.flagOf].filter((x): x is string => Boolean(x))) {
        const hits = FLAGS.filter((o) => [o.alpha3, o.numeric, o.emoji, ...o.flagOf].some((x) => x?.toLowerCase() === id.toLowerCase()));
        expect(hits.map((h) => h.slug), id).toEqual([f.slug]);
      }
    }
  });
});

describe("docs and counts do not drift from the metadata", () => {
  const total = getAllIcons().length;
  const variants = getAllIcons().reduce((n, i) => n + Object.keys(i.variants).length, 0);
  const label = (n: number): string => `${roundDownToHundred(n).toLocaleString("en-US")}+`;

  it("README, collections doc, flags doc and package README carry the generated counts", () => {
    for (const rel of ["README.md", "docs/flags.md", "docs/collections.md", "packages/flags/README.md"]) {
      const text = read(rel);
      for (const v of marker(text, "count")) expect(v, rel).toBe(String(FLAGS.length));
      for (const v of marker(text, "total-icons")) expect(v, rel).toBe(label(total));
      for (const v of marker(text, "total-variants")) expect(v, rel).toBe(label(variants));
      for (const v of marker(text, "iso")) expect(v, rel).toBe(String(FLAGS.filter((f) => f.iso).length));
      for (const v of marker(text, "files")) expect(v, rel).toBe(String(FLAGS.length * 3));
    }
    expect(marker(read("README.md"), "count").length).toBeGreaterThan(0);
  });

  it("the locale table lists every mapped locale", () => {
    const [table] = marker(read("docs/flags.md"), "locale-table");
    for (const [locale, code] of Object.entries(LOCALE_FLAGS)) expect(table).toContain(`| \`${locale}\` | \`flag-${code}\` |`);
  });

  it("llms.txt and llms-full.txt state the flag count and the helper", () => {
    for (const rel of ["public/llms.txt", "public/llms-full.txt"]) {
      const text = read(rel);
      expect(text).toContain(`${FLAGS.length} country and region flags`);
      expect(text).toContain("flag-gb-eng");
    }
    expect(read("public/llms-full.txt")).toContain("getFlagForLocale");
    expect(read("src/components/home-hero.tsx")).toContain(`${FLAGS.length} Country and Region Flags`);
    expect(read("public/llms.txt")).toContain(`${label(total).replace("+", "")}`.slice(0, 3));
  });
});
