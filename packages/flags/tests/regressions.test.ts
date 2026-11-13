import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { parse } from "../scripts/parse-svg.ts";
import { FLAGS } from "../src/data/flags.generated.ts";
import { findFlags } from "../src/search.ts";
import { getFlagForLocale } from "../src/locale.ts";
import { deriveWidth, scopeIds } from "../src/react/create-flag.ts";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ICONS = join(PKG, "../../public/icons");

test("root presentation attributes survive: Mongolia keeps its gold", () => {
  let affected = 0;
  for (const f of FLAGS) {
    for (const v of ["default", "square", "circle"]) {
      const svg = readFileSync(join(ICONS, f.slug, `${v}.svg`), "utf8").trim();
      const root = svg.match(/^<svg\b([^>]*)>/)![1];
      const attrs = [...root.matchAll(/\s([\w:-]+)="([^"]*)"/g)].filter((a) => !["xmlns", "xmlns:xlink", "viewBox", "width", "height", "xml:space", "id", "version"].includes(a[1]));
      const { inner } = parse(svg);
      for (const [, k, val] of attrs) assert.ok(inner.includes(`${k}="${val}"`), `${f.slug}/${v} keeps ${k}`);
      if (attrs.length > 0) affected++;
    }
  }
  assert.ok(affected >= 2);
  assert.match(parse(readFileSync(join(ICONS, "flag-mn/default.svg"), "utf8").trim()).inner, /^<g fill="#ffd900">/);
});

test("ids are scoped per instance and every reference resolves", async () => {
  const mod = await import(join(PKG, "dist/esm/react/index.js"));
  const html = renderToStaticMarkup(createElement("div", null, createElement(mod.FlagUs, { variant: "circle" }), createElement(mod.FlagGb, { variant: "circle" }), createElement(mod.FlagUs, { variant: "circle" }), createElement(mod.FlagEs, { variant: "circle" })));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 4, "fixture has ids");
  assert.equal(new Set(ids).size, ids.length, "all ids unique");
  const refs = [...html.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map((m) => m[1] ?? m[2]);
  assert.ok(refs.length > 0);
  for (const r of refs) assert.ok(ids.includes(r), `${r} resolves`);
});

test("scopeIds rewrites ids, url() and href forms", () => {
  const out = scopeIds('<mask id="a"/><g mask="url(#a)"/><use xlink:href="#a"/><use href="#a"/><path id="ab"/>', ["a", "ab"], "p-");
  assert.equal(out, '<mask id="p-a"/><g mask="url(#p-a)"/><use xlink:href="#p-a"/><use href="#p-a"/><path id="p-ab"/>');
  assert.equal(scopeIds("<g/>", undefined, "p-"), "<g/>");
});

test("deriveWidth keeps units and refuses unsafe arithmetic", () => {
  assert.equal(deriveWidth(24, 4 / 3), 32);
  assert.equal(deriveWidth("2em", 4 / 3), "2.67em");
  assert.equal(deriveWidth("30px", 1), "30px");
  assert.equal(deriveWidth("40", 1), 40);
  assert.equal(deriveWidth("50%", 4 / 3), undefined);
  assert.equal(deriveWidth("calc(1em + 2px)", 4 / 3), undefined);
});

test("locale parsing stops at extensions and handles scripts, regions and bad input", () => {
  const code = (l: string): string | undefined => getFlagForLocale(l)?.code;
  assert.equal(code("en-u-ca-gregory"), "us");
  assert.equal(code("de-u-co-phonebk"), "de");
  assert.equal(code("zh-Hans-CN"), "cn");
  assert.equal(code("zh-Hant-TW"), "tw");
  assert.equal(code("zh-Hant"), "tw");
  assert.equal(code("pt-PT"), "pt");
  assert.equal(code("es-419"), "es");
  assert.equal(code("x-private"), undefined);
  assert.equal(code("e"), undefined);
  assert.equal(code("--"), undefined);
  assert.equal(code("12-34"), undefined);
  assert.equal(code("fr-CA"), "ca");
});

test("native and localized names are searchable", () => {
  const cases: [string, string][] = [["日本", "jp"], ["中国", "cn"], ["한국", "kr"], ["Россия", "ru"], ["ألمانيا", "de"], ["भारत", "in"]];
  for (const [q, code] of cases) assert.equal(findFlags(q)[0]?.code, code, q);
});

test("aliases are already normalized, so generator and package normalization agree", async () => {
  const { squash } = await import("../src/search.ts");
  for (const f of FLAGS) for (const a of f.aliases) if (!/[\u{1F1E6}-\u{1F1FF}\u{1F3F4}#]|-/u.test(a)) assert.equal(squash(a), a, `${f.slug}: ${a}`);
});
