import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const built = existsSync(join(PKG, "dist/esm/react/index.js"));
const opts = { skip: built ? false : "run `pnpm build` in packages/flags first" };
const require = createRequire(import.meta.url);

test("per-flag React component renders decorative by default", opts, async () => {
  const { FlagUs } = await import(join(PKG, "dist/esm/react/us.js"));
  const html = renderToStaticMarkup(createElement(FlagUs));
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /height="24"/);
  assert.match(html, /width="32"/);
  assert.doesNotMatch(html, /<title>/);
});

test("title makes the flag an image; variants set the ratio", opts, async () => {
  const { FlagGbEng } = await import(join(PKG, "dist/esm/react/gb-eng.js"));
  const named = renderToStaticMarkup(createElement(FlagGbEng, { title: "England", variant: "circle", size: 40, className: "rounded" }));
  assert.match(named, /role="img"/);
  assert.match(named, /aria-label="England"/);
  assert.match(named, /<title>England<\/title>/);
  assert.match(named, /width="40"/);
  assert.match(named, /class="rounded"/);
  const rect = renderToStaticMarkup(createElement(FlagGbEng, { width: 50, height: 10 }));
  assert.match(rect, /width="50"/);
});

test("CommonJS build and plain SVG exports work", opts, async () => {
  const cjs = require(join(PKG, "dist/cjs/react/de.js"));
  assert.equal(typeof cjs.FlagDe, "object");
  const mod = await import(join(PKG, "dist/esm/flags/de.js"));
  for (const k of ["rect", "square", "circle"]) assert.match(mod[k], /^<svg /);
  assert.ok(existsSync(join(PKG, "dist/svg/1x1/de.svg")));
  const barrel = await import(join(PKG, "dist/esm/react/index.js"));
  assert.equal(Object.keys(barrel).filter((k) => k.startsWith("Flag")).length, 258);
});

test("every @thesvg/flags import in the docs resolves through the exports map", () => {
  const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as { exports: Record<string, unknown> };
  const files = [join(PKG, "README.md"), join(PKG, "../../docs/flags.md")];
  const patterns = Object.keys(pkg.exports).map((k) => new RegExp("^" + k.replace(/[.]/g, "\\.").replace("*", ".+") + "$"));
  let seen = 0;
  for (const f of files) {
    if (!existsSync(f)) continue;
    for (const m of readFileSync(f, "utf8").matchAll(/(?:from|import)\s+["'](@thesvg\/flags[^"']*)["']/g)) {
      const sub = "." + m[1].slice("@thesvg/flags".length);
      assert.ok(patterns.some((p) => p.test(sub)), `${f}: ${m[1]}`);
      seen++;
    }
  }
  assert.ok(seen >= 5);
});
