// Fails the build if a generated file is missing, malformed or would break at import time.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist");
const root = resolve(here, "../../..");
const manifest = JSON.parse(readFileSync(join(root, "src/data/ui-icons.json"), "utf8"));
const require = createRequire(import.meta.url);
let bad = 0;
for (const icon of manifest.icons) {
  for (const ext of ["js", "cjs", "d.ts"]) {
    if (!existsSync(join(dist, `${icon.slug}.${ext}`))) { console.error(`missing ${icon.slug}.${ext}`); bad++; }
  }
}
const cjs = require(join(dist, "index.cjs"));
const expected = manifest.icons.length * manifest.looks.length;
if (Object.keys(cjs).length !== expected) { console.error(`cjs exports ${Object.keys(cjs).length}, expected ${expected}`); bad++; }
const esm = await import(join(dist, "index.js"));
if (Object.keys(esm).length !== expected) { console.error(`esm exports ${Object.keys(esm).length}, expected ${expected}`); bad++; }
if (bad) process.exit(1);
console.log(`ok: ${expected} exports, esm and cjs match`);
