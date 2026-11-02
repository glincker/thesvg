import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_QUALITY_CONFIG } from "../quality";
import { CATEGORIES, GLYPHS, GLYPH_BY_SLUG, POPULAR_SLUGS, VARIANTS, VIEW_SETS, styleFor } from "../glyphs";

const ROOT = join(__dirname, "../../../..");
const SETS_DIR = join(ROOT, "src/data/ui/sets");
const readJson = <T>(rel: string): T => JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as T;

interface SetFile { id: string; name: string; releaseDate: string; glyphs: { slug: string; tags: string[]; nodes: unknown[] }[] }
interface Manifest { looks: string[]; sets: { id: string; count: number }[]; icons: { slug: string; set: string; score?: number; q?: number[] }[] }

const files = readdirSync(SETS_DIR).filter((f) => f.endsWith(".json"));
const sets = files.map((f) => ({ file: f, data: readJson<SetFile>(`src/data/ui/sets/${f}`) }));
const manifest = readJson<Manifest>("src/data/ui-icons.json");

describe("UI icon set files", () => {
  it("name each file after the set id and give it a release date", () => {
    for (const { file, data } of sets) {
      expect(file).toBe(`${data.id}.json`);
      expect(data.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("use kebab-case slugs that are unique across every set", () => {
    const seen = new Set<string>();
    for (const { data } of sets) {
      for (const g of data.glyphs) {
        expect(g.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(seen.has(g.slug), `duplicate slug ${g.slug}`).toBe(false);
        seen.add(g.slug);
      }
    }
  });

  it("give every icon geometry and at least two tags", () => {
    for (const { data } of sets) {
      for (const g of data.glyphs) {
        expect(g.nodes.length, `${g.slug} has no geometry`).toBeGreaterThan(0);
        expect(g.tags.length, `${g.slug} needs two tags`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("only list popular icons that exist", () => {
    for (const slug of POPULAR_SLUGS) expect(GLYPH_BY_SLUG.has(slug)).toBe(true);
    expect(POPULAR_SLUGS.length).toBeGreaterThan(0);
  });
});

describe("generated UI icon output", () => {
  it("lists every icon of every set in the manifest, in order", () => {
    const fromSets = sets.flatMap(({ data }) => data.glyphs.map((g) => g.slug)).sort();
    expect(manifest.icons.map((i) => i.slug)).toEqual(fromSets);
    for (const { data } of sets) expect(manifest.sets.find((s) => s.id === data.id)?.count).toBe(data.glyphs.length);
  });

  it("has one look file per look, each holding every icon as an svg", () => {
    expect(manifest.looks).toEqual([...VARIANTS]);
    for (const look of manifest.looks) {
      const icons = readJson<Record<string, string>>(`src/data/ui/looks/${look}.json`);
      expect(Object.keys(icons).sort()).toEqual(manifest.icons.map((i) => i.slug));
      for (const [slug, svg] of Object.entries(icons)) {
        expect(svg.startsWith("<svg"), `${slug} ${look}`).toBe(true);
        expect(svg).not.toMatch(/NaN|Infinity/);
      }
    }
  });

  it("keeps every icon above the build's quality minimum", () => {
    for (const i of manifest.icons) {
      expect(i.score, `${i.slug} has no score`).toBeDefined();
      expect(i.score as number).toBeGreaterThanOrEqual(DEFAULT_QUALITY_CONFIG.minScore);
      expect(i.q).toHaveLength(4);
    }
  });
});

describe("UI icon data as the site sees it", () => {
  it("counts every glyph once and groups them by set", () => {
    expect(GLYPHS).toHaveLength(manifest.icons.length);
    expect(VIEW_SETS.reduce((n, s) => n + s.count, 0)).toBe(GLYPHS.length);
    expect(CATEGORIES.reduce((n, c) => n + c.count, 0)).toBe(GLYPHS.length);
  });

  it("marks only the newest drop as new", () => {
    const newest = [...VIEW_SETS].sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""))[0].releaseDate;
    for (const s of VIEW_SETS) expect(s.isNew).toBe(s.releaseDate === newest);
  });

  it("orders the looks with outline first and glass second", () => {
    expect(VARIANTS.slice(0, 2)).toEqual(["outline", "glass"]);
  });

  it("gives glass its own rounder style", () => {
    expect(styleFor("glass").corner).toBe("round");
    expect(styleFor("outline").corner).toBe("chamfer");
  });
});
