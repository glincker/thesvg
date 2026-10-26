import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist");
const manifest = JSON.parse(readFileSync(join(resolve(here, "../../.."), "src/data/ui-icons.json"), "utf8"));
const expected = manifest.icons.length * manifest.looks.length;
const lines = readFileSync(join(dist, "index.js"), "utf8").trim().split("\n");
let bad = 0;
if (lines.length !== expected) { console.error(`barrel has ${lines.length} exports, expected ${expected}`); bad++; }
for (const l of lines) {
  const f = l.match(/from "\.\/(.+)"/)?.[1];
  if (!f || !existsSync(join(dist, f)) || !existsSync(join(dist, `${f}.d.ts`))) { console.error(`missing file for ${l}`); bad++; }
}
if (bad) process.exit(1);
console.log(`ok: ${expected} components with types`);
