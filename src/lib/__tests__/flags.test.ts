import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FLAGS } from "../../../packages/flags/src/data/flags.generated";
import { LOCALE_FLAGS } from "../../../packages/flags/src/locale-core";
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

describe("package sources the site imports", () => {
  it("use no .js import specifiers, which the site bundler cannot resolve to .ts", () => {
    const files = ["packages/flags/src/rank.ts", "packages/flags/src/locale-core.ts", "packages/flags/src/data/flags.generated.ts"];
    for (const rel of files) {
      const valueImports = read(rel).split("\n").filter((l) => /^\s*(import|export)\b.*from\s+["'][^"']+\.js["']/.test(l) && !/^\s*(import|export)\s+type\b/.test(l));
      expect(valueImports, rel).toEqual([]);
    }
  });
});

describe("contributing docs and templates", () => {
  it("exist and link to each other", () => {
    expect(read("docs/flags-contributing.md")).toContain("THIRD_PARTY_NOTICES.md");
    expect(read("CONTRIBUTING.md")).toContain("docs/flags-contributing.md");
    expect(read(".github/ISSUE_TEMPLATE/flag_fix.yml")).toContain("Source and license");
  });
});

describe("flags and the launch post are linked everywhere content is listed", () => {
  const posts = JSON.parse(read("src/data/posts.json")) as { slug: string; title: string; body: string }[];
  const post = posts.find((p) => p.slug === "country-flags");
  const dashes = [String.fromCharCode(0x2013), String.fromCharCode(0x2014)];

  it("the post exists with frontmatter fields and counts that match the metadata", () => {
    expect(post).toBeTruthy();
    expect(post!.title).toContain(`${FLAGS.length} flags`);
    expect(post!.body).toContain(`There are ${FLAGS.length} of them`);
    expect(post!.body).toContain(`${FLAGS.length * 3} SVG files`);
    for (const needle of ["@thesvg/flags", "getFlagForLocale", "aria-hidden", "not a language", "THIRD_PARTY_NOTICES.md", "flag-icons", "circle-flags", 'loading="lazy"', "flag_fix.yml"]) expect(post!.body, needle).toContain(needle);
    for (const d of dashes) expect((post!.body + post!.title).includes(d)).toBe(false);
  });

  it("footer, docs index, README, hero and llms files link to flags and the blog", () => {
    expect(read("src/components/footer.tsx")).toContain('href: "/collection/flags"');
    expect(read("src/components/footer.tsx")).toContain('href: "/blog"');
    expect(read("src/app/docs/page.tsx")).toContain("flags:");
    expect(read("src/lib/docs-nav.ts")).toContain('href: "/docs/flags"');
    expect(read("README.md")).toContain("https://thesvg.org/blog/country-flags");
    expect(read("README.md")).toContain("https://thesvg.org/collection/flags");
    expect(read("src/components/home-hero.tsx")).toContain("New: Flags");
    for (const rel of ["public/llms.txt", "public/llms-full.txt"]) expect(read(rel), rel).toContain("https://thesvg.org/blog/country-flags");
  });

  it("the feed and the sitemap list the post and the flags pages", async () => {
    expect(read("public/feed.xml")).toContain('<guid isPermaLink="true">https://thesvg.org/blog/country-flags</guid>');
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain("https://thesvg.org/blog/country-flags");
    expect(urls).toContain("https://thesvg.org/blog");
    expect(urls).toContain("https://thesvg.org/collection/flags");
    expect(urls).toContain("https://thesvg.org/docs/flags");
  });

  it("the changeset covers the new package and the touched generators", () => {
    const c = read(".changeset/add-flags-package.md");
    expect(c).toContain('"@thesvg/flags": minor');
    expect(c).toContain('"@thesvg/icons": patch');
    expect(c).toContain("not a breaking change");
  });
});
