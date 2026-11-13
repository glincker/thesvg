/**
 * Builds @thesvg/flags into dist/ from src/ and the generated flag data.
 *
 * Output:
 *   dist/esm, dist/cjs, dist/types   compiled helpers (index, locale, react/create-flag)
 *   dist/flags/<code>.js|cjs|d.ts    plain SVG strings per flag (rect, square, circle)
 *   dist/react/<code>.js|cjs|d.ts    one React component per flag
 *   dist/svg/{4x3,1x1,circle}/<code>.svg   raw files
 *   dist/manifest.json               metadata plus provenance
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { FLAGS } from "../src/data/flags.generated.ts";
import { parse } from "./parse-svg.ts";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG, "../..");
const DIST = join(PKG, "dist");

const VARIANT_FILES = { "4x3": "default", square: "square", circle: "circle" } as const;
const DIR_NAMES = { "4x3": "4x3", square: "1x1", circle: "circle" } as const;
type Shape = keyof typeof VARIANT_FILES;

const pascal = (code: string): string => "Flag" + code.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

rmSync(DIST, { recursive: true, force: true });
const tsc = (cfg: string[]): void => {
  execFileSync("npx", ["tsc", ...cfg], { cwd: PKG, stdio: "inherit" });
};
tsc(["-p", "tsconfig.esm.json"]);
tsc(["-p", "tsconfig.cjs.json"]);
writeFileSync(join(DIST, "cjs/package.json"), '{"type":"commonjs","sideEffects":false}\n');
writeFileSync(join(DIST, "esm/package.json"), '{"type":"module","sideEffects":false}\n');

for (const d of ["flags", "react"]) {
  mkdirSync(join(DIST, "esm", d), { recursive: true });
  mkdirSync(join(DIST, "cjs", d), { recursive: true });
  mkdirSync(join(DIST, "types", d), { recursive: true });
}
for (const dir of Object.values(DIR_NAMES)) mkdirSync(join(DIST, "svg", dir), { recursive: true });
// create-flag lands in dist/esm/react via tsc already (src/react/create-flag.ts).

for (const f of FLAGS) {
  const shapes = {} as Record<Shape, { viewBox: string; inner: string }>;
  const raw = {} as Record<Shape, string>;
  for (const s of Object.keys(VARIANT_FILES) as Shape[]) {
    const file = join(ROOT, "public/icons", f.slug, `${VARIANT_FILES[s]}.svg`);
    if (!existsSync(file)) throw new Error(`missing ${file}`);
    raw[s] = readFileSync(file, "utf8").trim();
    shapes[s] = parse(raw[s]);
    copyFileSync(file, join(DIST, "svg", DIR_NAMES[s], `${f.code}.svg`));
  }
  const name = pascal(f.code);
  const strings = { rect: raw["4x3"], square: raw.square, circle: raw.circle };
  const esmStr = Object.entries(strings).map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`).join("\n");
  writeFileSync(join(DIST, "esm/flags", `${f.code}.js`), esmStr + "\n");
  writeFileSync(join(DIST, "cjs/flags", `${f.code}.js`), Object.entries(strings).map(([k, v]) => `exports.${k} = ${JSON.stringify(v)};`).join("\n") + "\n");
  writeFileSync(join(DIST, "types/flags", `${f.code}.d.ts`), "export declare const rect: string;\nexport declare const square: string;\nexport declare const circle: string;\n");

  for (const sh of Object.values(shapes)) {
    const ids = [...sh.inner.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    if (ids.length > 0) (sh as { ids?: string[] }).ids = ids;
  }
  const data = JSON.stringify(shapes);
  writeFileSync(join(DIST, "esm/react", `${f.code}.js`), `import { createFlag } from "./create-flag.js";\nexport const ${name} = /* @__PURE__ */ createFlag("${name}", ${data});\nexport default ${name};\n`);
  writeFileSync(join(DIST, "cjs/react", `${f.code}.js`), `"use strict";\nconst { createFlag } = require("./create-flag.js");\nconst ${name} = createFlag("${name}", ${data});\nexports.${name} = ${name};\nexports.default = ${name};\n`);
  writeFileSync(join(DIST, "types/react", `${f.code}.d.ts`), `import type { FlagComponent } from "./create-flag.js";\nexport declare const ${name}: FlagComponent;\nexport default ${name};\n`);
}

const barrel = (cjs: boolean): string =>
  FLAGS.map((f) => (cjs ? `Object.defineProperty(exports, "${pascal(f.code)}", { enumerable: true, get: () => require("./${f.code}.js").${pascal(f.code)} });` : `export { ${pascal(f.code)} } from "./${f.code}.js";`)).join("\n") + "\n";
writeFileSync(join(DIST, "esm/react/index.js"), `export { createFlag } from "./create-flag.js";\n` + barrel(false));
writeFileSync(join(DIST, "cjs/react/index.js"), `"use strict";\nObject.defineProperty(exports, "createFlag", { enumerable: true, get: () => require("./create-flag.js").createFlag });\n` + barrel(true));
writeFileSync(
  join(DIST, "types/react/index.d.ts"),
  `export { createFlag } from "./create-flag.js";\nexport type { FlagComponent, FlagProps } from "./create-flag.js";\n` + FLAGS.map((f) => `export { ${pascal(f.code)} } from "./${f.code}.js";`).join("\n") + "\n",
);

const licenses = JSON.parse(readFileSync(join(PKG, "src/data/licenses.json"), "utf8")) as { sources: unknown };
writeFileSync(join(DIST, "manifest.json"), JSON.stringify({ sources: licenses.sources, flags: FLAGS }, null, 2) + "\n");
copyFileSync(join(ROOT, "THIRD_PARTY_NOTICES.md"), join(PKG, "THIRD_PARTY_NOTICES.md"));
console.log(`@thesvg/flags built: ${FLAGS.length} flags`);
