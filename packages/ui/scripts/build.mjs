// Writes the package from the committed manifest and look files: the manifest, the per-look JSON, and one SVG file
// per icon and look for people who want plain files. Nothing is invented or filtered here.
import { mkdirSync, rmSync, writeFileSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadManifest, readSvg } from "../../../scripts/ui/package-builder.mjs";
import { ANIMATED_SLUGS, animateSvg } from "../../../scripts/ui/anim-runtime.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = loadManifest();
const dist = join(pkg, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "looks"), { recursive: true });
cpSync(join(root, "src/data/ui-icons.json"), join(dist, "ui-icons.json"));
cpSync(join(root, "src/data/ui/looks"), join(dist, "looks"), { recursive: true });
for (const icon of manifest.icons) {
  mkdirSync(join(dist, "svg", icon.slug), { recursive: true });
  for (const look of manifest.looks) {
    writeFileSync(join(dist, "svg", icon.slug, `${look}.svg`), `${readSvg(icon.slug, look)}\n`);
    // The theme icons also ship a version that animates on load, for img tags and the CDN.
    if (ANIMATED_SLUGS.includes(icon.slug)) writeFileSync(join(dist, "svg", icon.slug, `${look}-animated.svg`), `${animateSvg(readSvg(icon.slug, look))}\n`);
  }
}
if (process.argv.includes("--check")) console.log(`ok: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
else console.log(`built @thesvg/ui: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
