import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist");
const manifest = JSON.parse(readFileSync(join(resolve(here, "../../.."), "src/data/ui-icons.json"), "utf8"));
const expected = manifest.icons.length * manifest.looks.length;
let bad = 0;
for (const icon of manifest.icons) for (const ext of ["js", "cjs", "d.ts"]) if (!existsSync(join(dist, `${icon.slug}.${ext}`))) { console.error(`missing ${icon.slug}.${ext}`); bad++; }
// Counted from the barrel text so this check needs no vue install.
const text = readFileSync(join(dist, "index.js"), "utf8");
const count = (text.match(/Icon\b/g) ?? []).length;
if (count !== expected) { console.error(`barrel names ${count}, expected ${expected}`); bad++; }
if (bad) process.exit(1);
console.log(`ok: ${expected} exports in the barrel`);
