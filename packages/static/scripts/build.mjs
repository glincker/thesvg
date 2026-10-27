// Copies every SVG file the registry references from public/icons into dist/svg/<slug>/<file>.svg and writes
// dist/icons.json (slug, title, hex, categories, variants). --check also verifies counts against the registry.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(pkg, "../..");
const dist = join(pkg, "dist");
const registry = JSON.parse(readFileSync(join(root, "src/data/icons.json"), "utf8"));

rmSync(dist, { recursive: true, force: true });
const manifest = [];
let files = 0;
for (const icon of registry) {
  const variants = {};
  for (const [name, publicPath] of Object.entries(icon.variants ?? {})) {
    const rel = publicPath.replace(/^\/icons\//, "");
    const src = join(root, "public/icons", rel);
    if (!existsSync(src)) throw new Error(`missing SVG for ${icon.slug}/${name}: ${publicPath}`);
    const out = join(dist, "svg", rel);
    mkdirSync(dirname(out), { recursive: true });
    if (!existsSync(out)) {
      copyFileSync(src, out);
      files++;
    }
    variants[name] = rel;
  }
  manifest.push({ slug: icon.slug, title: icon.title, hex: icon.hex, categories: icon.categories, variants });
}
writeFileSync(join(dist, "icons.json"), `${JSON.stringify(manifest)}\n`);

if (process.argv.includes("--check")) {
  const built = JSON.parse(readFileSync(join(dist, "icons.json"), "utf8"));
  if (built.length !== registry.length) throw new Error(`manifest ${built.length} != registry ${registry.length}`);
  for (const icon of built) {
    if (!Object.keys(icon.variants).length) throw new Error(`no variants: ${icon.slug}`);
  }
  console.log(`ok: ${built.length} icons (registry ${registry.length}), ${files} svg files`);
} else {
  console.log(`built @thesvg/static: ${manifest.length} icons, ${files} svg files`);
}
