import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

import {
  generateCjs,
  generateDts,
  generateDtsBarrel,
  generateEsm,
  generateEsmBarrel,
  generateTypesDeclaration,
  type RawIcon,
} from "./codegen.ts";

/** Names every per-icon module exports. A slug equal to one of them must still work. */
const EXPORT_NAMES = ["slug", "title", "hex", "categories", "aliases", "svg", "variants", "license", "url"];

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';

function fixtureIcon(slug: string): RawIcon {
  return {
    slug,
    title: slug,
    aliases: [],
    hex: "000000",
    categories: ["DevTool"],
    variants: { default: `/icons/${slug}/default.svg` },
    license: "CC0-1.0",
    url: "https://example.com",
  };
}

/** Write files into a fresh temp dir laid out like the published package. */
function writeDist(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "thesvg-icons-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
}

/**
 * Run `code` as an ES module in `dir` with plain `node`, the way a consumer
 * would. Spawning keeps the test runner's TypeScript loader out of the way,
 * since it would happily strip TS-only syntax that real consumers choke on.
 */
function runEsm(dir: string, code: string) {
  writeFileSync(join(dir, "check.mjs"), code);
  return spawnSync(process.execPath, ["check.mjs"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, NODE_OPTIONS: "" },
  });
}

test("ESM barrel is plain JavaScript that node can import", () => {
  const icon = fixtureIcon("github");
  const dir = writeDist({
    "github.js": generateEsm(icon, { default: SVG }, SVG),
    "index.js": generateEsmBarrel(["github"]),
  });

  const result = runEsm(
    dir,
    `import { github } from "./index.js";\nconsole.log(JSON.stringify({ slug: github.slug, svg: github.svg }));`,
  );

  assert.equal(result.status, 0, `importing the ESM barrel failed:\n${result.stderr}`);
  assert.deepEqual(JSON.parse(result.stdout), { slug: "github", svg: SVG });
});

test("type barrel still re-exports the shared IconModule and IconVariants types", () => {
  assert.match(
    generateDtsBarrel(["github"]),
    /^export type \{ IconModule, IconVariants \} from "\.\/types\.js";$/m,
  );
});

test("per-icon ESM modules import even when the slug matches one of their export names", () => {
  const slugs = [...EXPORT_NAMES, "github"];
  const files: Record<string, string> = {};
  for (const slug of slugs) files[`${slug}.js`] = generateEsm(fixtureIcon(slug), { default: SVG }, SVG);
  const dir = writeDist(files);

  const result = runEsm(
    dir,
    [
      `const out = {};`,
      `for (const slug of ${JSON.stringify(slugs)}) {`,
      `  const mod = await import(\`./\${slug}.js\`);`,
      `  out[slug] = mod.default.slug === slug && mod.svg === mod.default.svg;`,
      `}`,
      `console.log(JSON.stringify(out));`,
    ].join("\n"),
  );

  assert.equal(result.status, 0, `importing per-icon modules failed:\n${result.stderr}`);
  const out = JSON.parse(result.stdout) as Record<string, boolean>;
  for (const slug of slugs) assert.ok(out[slug], `module for slug "${slug}" exported the wrong data`);
});

test("per-icon type declarations type-check even when the slug matches one of their export names", () => {
  const slugs = [...EXPORT_NAMES, "github"];
  const files: Record<string, string> = {
    "types.d.ts": generateTypesDeclaration(),
    "index.d.ts": generateDtsBarrel(slugs),
    "consumer.ts": slugs
      .map((slug, i) => `import icon${i}, { svg as svg${i} } from "./${slug}.js";\nexport const t${i}: string = icon${i}.title + svg${i};`)
      .join("\n"),
  };
  for (const slug of slugs) files[`${slug}.d.ts`] = generateDts(fixtureIcon(slug));
  const dir = writeDist(files);

  const program = ts.createProgram([join(dir, "consumer.ts")], {
    strict: true,
    noEmit: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ES2022,
    types: [],
  });
  const errors = ts
    .getPreEmitDiagnostics(program)
    .map((d) => `${d.file?.fileName.replace(dir, "") ?? ""}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);

  assert.deepEqual(errors, []);
});

test("per-icon modules inline each SVG string only once", () => {
  // `svg` is always one of the variants, so writing it out again doubles the
  // largest part of every module (the package is size-capped in validate-dist).
  const MONO = SVG.replace("M2 2", "M3 3");
  const icon = fixtureIcon("github");
  for (const [format, code] of [
    ["esm", generateEsm(icon, { default: SVG, mono: MONO }, SVG)],
    ["cjs", generateCjs(icon, { default: SVG, mono: MONO }, SVG)],
  ] as const) {
    assert.equal(code.split(SVG).length - 1, 1, `${format}: default SVG written more than once`);
    assert.equal(code.split(MONO).length - 1, 1, `${format}: mono SVG written more than once`);
  }
});

test("svg still equals its variant at runtime, and export order is unchanged", () => {
  const MONO = SVG.replace("M2 2", "M3 3");
  const icon = fixtureIcon("github");
  const dir = writeDist({
    "github.js": generateEsm(icon, { mono: MONO, default: SVG }, SVG),
    "github.cjs": generateCjs(icon, { mono: MONO, default: SVG }, SVG),
  });
  const result = runEsm(
    dir,
    [
      `import { createRequire } from "node:module";`,
      `import * as esm from "./github.js";`,
      `const cjs = createRequire(import.meta.url)("./github.cjs");`,
      `console.log(JSON.stringify({`,
      `  esm: [esm.svg, esm.variants, esm.default.svg, Object.keys(esm.default)],`,
      `  cjs: [cjs.svg, cjs.variants, cjs.default.svg, Object.keys(cjs).filter((k) => k !== "default")],`,
      `}));`,
    ].join("\n"),
  );
  assert.equal(result.status, 0, result.stderr);
  const out = JSON.parse(result.stdout) as Record<"esm" | "cjs", [string, Record<string, string>, string, string[]]>;
  const order = ["slug", "title", "hex", "categories", "aliases", "svg", "variants", "license", "url"];
  for (const format of ["esm", "cjs"] as const) {
    const [svg, variants, defaultSvg, keys] = out[format];
    assert.equal(svg, SVG, format);
    assert.equal(defaultSvg, SVG, format);
    assert.deepEqual(variants, { mono: MONO, default: SVG }, format);
    assert.deepEqual(keys, order, format);
  }
});
