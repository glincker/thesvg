import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { familyOf } from "../../../scripts/flags/colors.mjs";
import { FLAGS } from "../src/data/flags.generated.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const flag = (code: string) => FLAGS.find((f) => f.code === code)!;
const families = (code: string): string[] => flag(code).colors.map((c) => familyOf(c.hex));

test("palette extraction on known flags", () => {
  assert.deepEqual([...families("fr")].sort(), ["blue", "red", "white"]);
  assert.deepEqual(families("jp"), ["white", "red"]);
  assert.equal(flag("jp").colors[0].share > 60, true);
  assert.deepEqual([...families("de")].sort(), ["black", "gold", "red"]);
  assert.deepEqual([...families("ie")].sort(), ["green", "orange", "white"]);
  assert.deepEqual([...flag("de").colorNames].sort(), ["black", "gold", "red"]);
});

test("palettes are capped, ordered by share, and shares are percentages", () => {
  for (const f of FLAGS) {
    assert.ok(f.colors.length >= 1 && f.colors.length <= 6, f.slug);
    for (let i = 1; i < f.colors.length; i++) assert.ok(f.colors[i - 1].share >= f.colors[i].share, f.slug);
    for (const c of f.colors) assert.match(c.hex, /^[0-9a-f]{6}$/);
    assert.ok(f.colors.reduce((n, c) => n + c.share, 0) <= 101, f.slug);
  }
});

test("the color family classifier follows its documented rule", () => {
  const cases: [string, string][] = [["000000", "black"], ["ffffff", "white"], ["808080", "gray"], ["ff0000", "red"], ["ffb6c1", "pink"], ["8b4513", "brown"], ["ff7900", "orange"], ["ffcc00", "gold"], ["ffff00", "yellow"], ["009a49", "green"], ["000091", "blue"], ["800080", "purple"]];
  for (const [hex, family] of cases) assert.equal(familyOf(hex), family, hex);
});

test("catalog hex is the dominant non-white color, and flags with palettes carry the aliases for them", () => {
  const icons = JSON.parse(readFileSync(join(ROOT, "src/data/icons.json"), "utf8")) as { slug: string; hex: string; collectionMeta?: { colors?: string[] } }[];
  for (const f of FLAGS) {
    const entry = icons.find((i) => i.slug === f.slug)!;
    const dominant = f.colors.find((c) => familyOf(c.hex) !== "white") ?? f.colors[0];
    assert.equal(entry.hex, dominant.hex, f.slug);
    assert.deepEqual(entry.collectionMeta?.colors, f.colors.map((c) => `${c.hex}:${c.share}`));
    for (const c of f.colors) assert.ok(f.aliases.includes(c.hex), `${f.slug} alias ${c.hex}`);
  }
  assert.ok(flag("fr").aliases.includes("tricolor"));
});

test("metadata stays compact", () => {
  const bytes = Buffer.byteLength(JSON.stringify(FLAGS.map((f) => ({ c: f.colors, n: f.colorNames }))));
  assert.ok(bytes < 40_000, `${bytes} bytes of palette data`);
});
