// Writes public/ui/<slug>/<look>.svg from the committed look files. These are build artifacts: the site serves them
// at thesvg.org/ui/<slug>/<look>.svg for hotlinking, but they are not committed. Runs as part of `pnpm build`.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ANIMATED_SLUGS, animateSvg } from "./anim-runtime.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const dir = join(ROOT, "src/data/ui/looks");
const out = join(ROOT, "public/ui");
rmSync(out, { recursive: true, force: true });
let n = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const look = file.replace(/\.json$/, "");
  const icons = JSON.parse(readFileSync(join(dir, file), "utf8"));
  for (const [slug, svg] of Object.entries(icons)) {
    mkdirSync(join(out, slug), { recursive: true });
    writeFileSync(join(out, slug, `${look}.svg`), `${svg}\n`);
    n++;
    if (ANIMATED_SLUGS.includes(slug)) {
      writeFileSync(join(out, slug, `${look}-animated.svg`), `${animateSvg(svg)}\n`);
      n++;
    }
  }
}
console.log(`wrote ${n} svg files to public/ui`);
