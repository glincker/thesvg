import assert from "node:assert/strict";
import { test } from "node:test";

import { findFlags, getFlag } from "../src/search.ts";
import { getFlagForLocale } from "../src/locale.ts";

const EXPECTED: Record<string, string> = {
  en: "us", "en-GB": "gb", es: "es", "es-MX": "mx", de: "de", fr: "fr", "pt-BR": "br", "pt-PT": "pt", ja: "jp",
  "zh-CN": "cn", "zh-TW": "tw", ar: "sa", hi: "in", ru: "ru", ko: "kr", it: "it", nl: "nl", pl: "pl", tr: "tr", id: "id",
};

test("getFlagForLocale maps the 20 supported locales", () => {
  for (const [locale, code] of Object.entries(EXPECTED)) assert.equal(getFlagForLocale(locale)?.code, code, locale);
});

test("getFlagForLocale falls back to the region, then the language, then nothing", () => {
  assert.equal(getFlagForLocale("fr-CA")?.code, "ca");
  assert.equal(getFlagForLocale("en_AU")?.code, "au");
  assert.equal(getFlagForLocale("ca")?.slug, "flag-es-ct");
  assert.equal(getFlagForLocale("xx"), undefined);
  assert.equal(getFlagForLocale(""), undefined);
});

const LOOKUPS: [string, string][] = [
  ["deutschland", "de"], ["DEU", "de"], ["276", "de"], ["holland", "nl"], ["england", "gb-eng"], ["catalunya", "es-ct"],
  ["pt-BR", "br"], ["\u{1F1E9}\u{1F1EA}", "de"], ["UK", "gb"], ["Cote d'Ivoire", "ci"], ["Burma", "mm"], ["scotland", "gb-sct"],
  ["euskadi", "es-pv"], ["kosova", "xk"], ["nippon", "jp"], ["EU", "eu"],
];

test("findFlags resolves alternative names, codes, emoji and locale tags", () => {
  for (const [query, code] of LOOKUPS) assert.equal(findFlags(query)[0]?.code, code, query);
});

test("exact identifiers resolve to exactly one flag", () => {
  for (const q of ["deu", "276", "pt-br", "\u{1F1E9}\u{1F1EA}", "xkx"]) assert.equal(findFlags(q).filter((f) => [f.alpha3?.toLowerCase(), f.numeric, f.emoji, ...f.flagOf.map((l) => l.toLowerCase())].includes(q.toLowerCase())).length, 1, q);
  assert.equal(getFlag("flag-us")?.code, "us");
  assert.equal(getFlag("GBR")?.code, "gb");
});
