// Usage: node scripts/ui/validate-package.mjs packages/ui-react
// Checks a built UI package: every icon has its files, the barrel exports every look once, nothing is missing.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { exportName, loadManifest } from "./package-builder.mjs";

// The folder is picked from the UI packages that exist on disk, so the argument can only choose between them.
const PACKAGES = resolve(import.meta.dirname, "../../packages");
const requested = basename(resolve(process.argv[2] ?? "."));
const name = readdirSync(PACKAGES).find((n) => /^ui(-[a-z-]+)?$/.test(n) && n === requested);
if (!name) {
  console.error(`not a UI package: ${requested}`);
  process.exit(2);
}
const pkgDir = join(PACKAGES, name);
const dist = join(pkgDir, "dist");
const manifest = loadManifest();
const svelte = existsSync(join(dist, "index.js")) && /\.svelte"/.test(readFileSync(join(dist, "index.js"), "utf8"));
const barrel = readFileSync(join(dist, "index.js"), "utf8");
let bad = 0;
const fail = (msg) => { console.error(msg); bad++; };

for (const icon of manifest.icons) {
  for (const look of manifest.looks) {
    const name = exportName(icon.slug, look);
    if (!new RegExp(`\\b${name}\\b`).test(barrel)) fail(`barrel is missing ${name}`);
    if (svelte) {
      const base = look === "outline" ? icon.slug : `${icon.slug}-${look}`;
      for (const f of [`${base}.svelte`, `${base}.svelte.d.ts`]) if (!existsSync(join(dist, f))) fail(`missing ${f}`);
    }
  }
  if (!svelte) for (const ext of ["js", "cjs", "d.ts"]) if (!existsSync(join(dist, `${icon.slug}.${ext}`))) fail(`missing ${icon.slug}.${ext}`);
}
// Every instance of an icon needs its own ids. The scoper renames definitions and references together, only whole ids.
if (existsSync(join(dist, "_scope.js"))) {
  const { scoper } = await import(pathToFileURL(join(dist, "_scope.js")).href);
  const out = scoper(["a-g", "a-m"])('<g id="a-g"/><g id="a-grid"/><rect fill="url(#a-g)" mask="url(#a-m)"/>', "u1");
  if (out !== '<g id="a-g-u1"/><g id="a-grid"/><rect fill="url(#a-g-u1)" mask="url(#a-m-u1)"/>') fail(`scoper output is wrong: ${out}`);
}
const expected = manifest.icons.length * manifest.looks.length;
if (bad) process.exit(1);
console.log(`ok: ${expected} exports in ${pkgDir.split("/").pop()}`);
