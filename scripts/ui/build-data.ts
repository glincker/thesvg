// Builds everything derived from the UI icon set files in src/data/ui/sets:
//   src/data/ui-icons.json          the manifest every extension and package reads
//   src/data/ui/looks/<look>.json   every icon rendered in one look, slug to full SVG text, one icon per line
//   src/lib/ui-icons/sets.generated.ts   the site's import list for the set files
// The per-icon .svg files (public/ui) are not committed. `pnpm ui:svgs` writes them from the look files for the site build.
// Run `pnpm ui:build` after adding or changing a set file. `--check` fails if the committed output is stale.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import SVGPathCommander from "svg-path-commander";
import { DEFAULT_STYLE, renderIcon, type IconNode } from "@/lib/ui-icons/engine";
import { medianOf, qualityConfigFromEnv, scoreQuality, type Measurements } from "@/lib/ui-icons/quality";
import { VARIANTS, categoryOf, styleFor } from "@/lib/ui-icons/style";

interface SetFile {
  id: string;
  name: string;
  note: string;
  releaseDate: string;
  glyphs: { slug: string; tags: string[]; nodes: IconNode[] }[];
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SETS_DIR = join(ROOT, "src/data/ui/sets");
const check = process.argv.includes("--check");

const files = readdirSync(SETS_DIR).filter((f) => f.endsWith(".json")).sort();
const sets: SetFile[] = files.map((f) => JSON.parse(readFileSync(join(SETS_DIR, f), "utf8")) as SetFile);
sets.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate) || a.id.localeCompare(b.id));

const seen = new Set<string>();
for (const s of sets) {
  for (const g of s.glyphs) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug)) throw new Error(`bad slug ${g.slug} in ${s.id}`);
    if (seen.has(g.slug)) throw new Error(`duplicate slug ${g.slug} in ${s.id}`);
    if (g.tags.length < 2) throw new Error(`${g.slug} needs at least two tags`);
    seen.add(g.slug);
  }
}

/** Bounds and ink length of the outline drawing, sampled along the path. */
function measureGeometry(nodes: IconNode[]): Pick<Measurements, "minX" | "maxX" | "minY" | "maxY" | "length"> {
  const d = renderIcon(nodes, { variant: "outline", style: { ...DEFAULT_STYLE, corner: "source" } }).d;
  let minX = 99, maxX = -99, minY = 99, maxY = -99, length = 0;
  for (const path of d) {
    for (const part of path.split("M").filter(Boolean)) {
      const spc = new SVGPathCommander(`M${part}`);
      const total = spc.getTotalLength();
      length += total;
      const n = Math.max(2, Math.ceil(total / 0.5));
      for (let i = 0; i <= n; i++) {
        const p = spc.getPointAtLength((total * i) / n);
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
    }
  }
  return { minX, maxX, minY, maxY, length };
}

const qualityConfig = qualityConfigFromEnv(process.env);
const measured = new Map<string, Measurements>();
const out = new Map<string, string>();
const looks = new Map<string, string[]>(VARIANTS.map((l) => [l, []]));
const icons: { slug: string; title: string; category: string; tags: string[]; set: string; releasedOn: string; score?: number; q?: number[] }[] = [];
for (const s of sets) {
  for (const g of s.glyphs) {
    let looksOk = 0;
    for (const look of VARIANTS) {
      const svg = renderIcon(g.nodes, { variant: look, style: styleFor(look), size: 24, idPrefix: `${g.slug}-${look}` }).svg;
      if (!svg.startsWith("<svg") || svg.includes("NaN")) throw new Error(`bad svg for ${g.slug} ${look}`);
      looksOk++;
      looks.get(look)?.push(`  ${JSON.stringify(g.slug)}: ${JSON.stringify(svg)}`);
    }
    measured.set(g.slug, { ...measureGeometry(g.nodes), looksOk, looks: VARIANTS.length });
    icons.push({ slug: g.slug, title: g.slug.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" "), category: categoryOf(g.slug), tags: g.tags, set: s.id, releasedOn: s.releaseDate });
  }
}
// Quality needs the whole set for its weight check, so it is scored after every icon is measured.
const median = medianOf([...measured.values()].map((m) => m.length));
const low: string[] = [];
for (const icon of icons) {
  const m = measured.get(icon.slug);
  if (!m) continue;
  const { total, parts } = scoreQuality({ tags: icon.tags, category: icon.category }, m, median, qualityConfig);
  icon.score = total;
  icon.q = parts;
  if (total < qualityConfig.minScore) low.push(`${icon.slug} (${total})`);
}
if (low.length) throw new Error(`Icons below the quality minimum of ${qualityConfig.minScore}: ${low.join(", ")}`);
icons.sort((a, b) => a.slug.localeCompare(b.slug));
for (const [look, lines] of looks) out.set(`src/data/ui/looks/${look}.json`, `{\n${lines.sort().join(",\n")}\n}\n`);
const manifest = { version: 1, kind: "ui", looks: VARIANTS, files: "/ui/{slug}/{look}.svg", lookFiles: "/src/data/ui/looks/{look}.json", sets: sets.map((s) => ({ id: s.id, name: s.name, releaseDate: s.releaseDate, count: s.glyphs.length })), icons };
out.set("src/data/ui-icons.json", `${JSON.stringify(manifest)}\n`);

// The file name is the set id, so the generated import list follows release order without a second index to keep in sync.
for (const s of sets) if (!files.includes(`${s.id}.json`)) throw new Error(`set ${s.id} must live in ${s.id}.json`);
const names = sets.map((s) => s.id);
const imports = names.map((n, i) => `import set${i} from "@/data/ui/sets/${n}.json";`).join("\n");
out.set(
  "src/lib/ui-icons/sets.generated.ts",
  `// Generated by scripts/ui/build-data.ts. Do not edit.\n${imports}\n\nexport interface SetData {\n  id: string;\n  name: string;\n  note: string;\n  releaseDate: string;\n  glyphs: { slug: string; tags: string[]; nodes: unknown[] }[];\n}\n\nexport const SETS: SetData[] = [${names.map((_, i) => `set${i}`).join(", ")}];\n`,
);

if (check) {
  const stale: string[] = [];
  for (const [rel, content] of out) {
    const p = join(ROOT, rel);
    if (!existsSync(p) || readFileSync(p, "utf8") !== content) stale.push(rel);
  }
  if (stale.length) {
    console.error(`UI icon output is out of date (${stale.length} files, first: ${stale.slice(0, 3).join(", ")}). Run pnpm ui:build.`);
    process.exit(1);
  }
  console.log(`ok: ${icons.length} icons x ${VARIANTS.length} looks are up to date, lowest quality ${Math.min(...icons.map((i) => i.score ?? 0))}`);
} else {
  rmSync(join(ROOT, "src/data/ui/looks"), { recursive: true, force: true });
  for (const [rel, content] of out) {
    const p = join(ROOT, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  console.log(`built ${icons.length} icons x ${VARIANTS.length} looks from ${sets.length} sets, lowest quality ${Math.min(...icons.map((i) => i.score ?? 0))}`);
}
