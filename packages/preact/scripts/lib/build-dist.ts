/**
 * build-dist.ts
 *
 * The build flow shared by @thesvg/solid and @thesvg/preact (identical copy in
 * each package). A "flavor" supplies only what differs per framework: the
 * runtime helper source and the shape of the type declarations. Every icon file
 * is a one-line call into the runtime, so the per-icon output stays small.
 *
 * Output layout in dist/:
 *   _runtime.js / _runtime.cjs   framework glue (makeIcon)
 *   {slug}.js / .cjs / .d.ts     one component per icon
 *   types.d.ts, types.js, types.cjs
 *   index.js / index.cjs / index.d.ts
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  makeReader,
  needsIdNamespacing,
  parseIcon,
  toPascalCase,
  toSafeIdentifier,
  variantUnion,
  type ParsedIcon,
  type RawIcon,
} from "./svg-tree.ts";

export interface Flavor {
  /** npm name, used in file banners. */
  pkg: string;
  runtimeEsm: string;
  runtimeCjs: string;
  /** Contents of dist/types.d.ts. */
  typesDts: string;
  /** Per-icon declaration; `variants` is a quoted union such as 'default' | 'mono'. */
  iconDts: (name: string, title: string, variants: string) => string;
}

function iconModule(flavor: Flavor, icon: RawIcon, parsed: ParsedIcon | null, cjs: boolean): string {
  const name = toPascalCase(icon.slug);
  const data = parsed ? JSON.stringify(parsed.variants) : "null";
  const ns = parsed ? needsIdNamespacing(parsed) : false;
  const banner = `// ${flavor.pkg} - ${icon.title}\n// Auto-generated. Do not edit.`;
  const call = `/* @__PURE__ */ makeIcon('${name}', ${data}, ${ns})`;
  if (cjs) {
    return [
      `"use strict";`,
      banner,
      `Object.defineProperty(exports, "__esModule", { value: true });`,
      `const { makeIcon } = require('./_runtime.cjs');`,
      `exports.default = ${call};`,
      ``,
    ].join("\n");
  }
  return [banner, `import { makeIcon } from './_runtime.js';`, `export default ${call};`, ``].join("\n");
}

export function buildDist(flavor: Flavor, scriptDir: string): void {
  const pkgRoot = resolve(scriptDir, "..");
  const repoRoot = resolve(pkgRoot, "../..");
  const dist = join(pkgRoot, "dist");
  const read = makeReader(repoRoot);

  const icons = JSON.parse(readFileSync(join(repoRoot, "src/data/icons.json"), "utf8")) as RawIcon[];
  console.log(`Found ${icons.length} icons.`);

  // Wipe first so components for removed or renamed slugs never linger.
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  const w = (file: string, body: string): void => writeFileSync(join(dist, file), body);
  w("_runtime.js", flavor.runtimeEsm);
  w("_runtime.cjs", flavor.runtimeCjs);

  const entries: Array<{ slug: string; name: string }> = [];
  let missing = 0;
  for (const icon of icons) {
    const parsed = parseIcon(icon, read);
    if (!parsed) missing++;
    w(`${icon.slug}.js`, iconModule(flavor, icon, parsed, false));
    w(`${icon.slug}.cjs`, iconModule(flavor, icon, parsed, true));
    w(`${icon.slug}.d.ts`, flavor.iconDts(toPascalCase(icon.slug), icon.title, variantUnion(parsed)));
    entries.push({ slug: icon.slug, name: toPascalCase(icon.slug) });
  }

  w("types.d.ts", flavor.typesDts);
  w("types.js", `// ${flavor.pkg} - shared types (declaration-only)\nexport {};\n`);
  w("types.cjs", `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\n`);

  const banner = `// ${flavor.pkg}\n// Auto-generated barrel. Do not edit.\n`;
  w("index.js", [banner, ...entries.map((e) => `export { default as ${e.name} } from './${e.slug}.js';`), ""].join("\n"));
  w(
    "index.cjs",
    [
      `"use strict";`,
      banner,
      `Object.defineProperty(exports, "__esModule", { value: true });`,
      ...entries.flatMap((e) => [
        `const _${toSafeIdentifier(e.slug)} = require('./${e.slug}.cjs');`,
        `exports.${e.name} = _${toSafeIdentifier(e.slug)}.default;`,
      ]),
      "",
    ].join("\n"),
  );
  w(
    "index.d.ts",
    [
      banner,
      `export type { SvgIconProps, SvgIconComponent } from './types.js';`,
      ...entries.map((e) => `export { default as ${e.name} } from './${e.slug}.js';`),
      "",
    ].join("\n"),
  );

  console.log(`Done. Built ${entries.length} components (${missing} had no SVG source).`);
  console.log(`Output: ${dist}`);
}

/** Resolves the directory of the calling script, for buildDist(flavor, dir). */
export function scriptDirOf(metaUrl: string): string {
  return dirname(fileURLToPath(metaUrl));
}
