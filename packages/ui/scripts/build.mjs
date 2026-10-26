// Copies the released UI icon manifest and SVG files into dist. The data itself is produced upstream
// and committed as src/data/ui-icons.json and public/ui, so this package never invents or filters icons.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "src/data/ui-icons.json");
const svgRoot = join(root, "public/ui");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

// Every icon in the manifest must have a file for every look, or the package would ship dead links.
const missing = [];
for (const icon of manifest.icons) {
  for (const look of manifest.looks) {
    if (!existsSync(join(svgRoot, icon.slug, `${look}.svg`))) missing.push(`${icon.slug}/${look}`);
  }
}
if (missing.length) {
  console.error(`missing ${missing.length} svg files, first: ${missing.slice(0, 5).join(", ")}`);
  process.exit(1);
}
const onDisk = readdirSync(svgRoot).length;
if (onDisk !== manifest.icons.length) {
  console.error(`public/ui has ${onDisk} folders but the manifest lists ${manifest.icons.length}`);
  process.exit(1);
}
if (process.argv.includes("--check")) {
  console.log(`ok: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
  process.exit(0);
}
const dist = join(pkg, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "svg"), { recursive: true });
cpSync(manifestPath, join(dist, "ui-icons.json"));
cpSync(svgRoot, join(dist, "svg"), { recursive: true });
console.log(`built @thesvg/ui: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
