import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const budget = JSON.parse(readFileSync(join(PKG, "budget.json"), "utf8")) as Record<string, number>;
const e = (p: string): string => join(PKG, "dist/esm", p);

async function bundle(code: string): Promise<string> {
  const r = await build({
    stdin: { contents: code, resolveDir: PKG },
    bundle: true, minify: true, write: false, format: "esm", platform: "browser", external: ["react"],
    alias: { "@f/react/us": e("react/us.js"), "@f/react": e("react/index.js"), "@f/flags/us": e("flags/us.js"), "@f/locale": e("index.js"), "@f/search": e("search.js") },
  });
  return r.outputFiles[0].text;
}

test("one flag component stays small and ships no other flag or metadata", async () => {
  const out = await bundle('import { FlagUs } from "@f/react/us"; console.log(FlagUs);');
  assert.ok(out.length <= budget.oneFlagComponent, `${out.length} bytes`);
  assert.ok(!out.includes("deutschland") && !out.includes("flag-de"));
});

test("importing one flag from the react barrel tree-shakes the other 257", async () => {
  const out = await bundle('import { FlagUs } from "@f/react"; console.log(FlagUs);');
  assert.ok(out.length <= budget.oneFlagViaBarrel, `${out.length} bytes`);
});

test("a plain SVG module is tiny", async () => {
  const out = await bundle('import { rect } from "@f/flags/us"; console.log(rect);');
  assert.ok(out.length <= budget.rawSvgModule, `${out.length} bytes`);
});

test("getFlagForLocale pulls only the small locale map, not the search metadata", async () => {
  const out = await bundle('import { getFlagForLocale } from "@f/locale"; console.log(getFlagForLocale("de"));');
  assert.ok(out.length <= budget.localeHelper, `${out.length} bytes`);
  assert.ok(!out.includes("deutschland") && !out.includes("bundesrepublik"), "search aliases leaked into the locale bundle");
});

test("the search subpath carries the metadata within budget", async () => {
  const out = await bundle('import { findFlags } from "@f/search"; console.log(findFlags("de"));');
  assert.ok(out.length <= budget.searchSubpath, `${out.length} bytes`);
  assert.ok(out.includes("deutschland"));
});
