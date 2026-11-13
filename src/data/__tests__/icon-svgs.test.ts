import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import iconsData from "@/data/icons.json";
import type { IconEntry } from "@/lib/icons";

const PUBLIC_DIR = fileURLToPath(new URL("../../../public", import.meta.url));

/** Every distinct SVG file the catalog points at, e.g. "/icons/github/default.svg". */
const variantPaths = [
  ...new Set(
    (iconsData as IconEntry[]).flatMap((icon) =>
      Object.values(icon.variants).filter(
        (p): p is string => typeof p === "string",
      ),
    ),
  ),
];

/**
 * True when the root <svg> carries a quoted viewBox of four numbers, which is
 * what the component builders can parse. An absent, empty or partial value
 * makes them fall back to "0 0 24 24".
 */
function hasUsableViewBox(svg: string): boolean {
  const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? "";
  return /\sviewBox\s*=\s*(["'])\s*-?[\d.]+(?:[\s,]+-?[\d.]+){3}\s*\1/.test(
    root,
  );
}

describe("hasUsableViewBox", () => {
  it.each([
    ['<svg viewBox="0 0 24 24">', true],
    ["<svg viewBox='0,0,410,82' width=\"410\">", true],
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 26.5 26">', true],
    ['<svg width="410" height="82">', false],
    ['<svg viewBox="">', false],
    ['<svg viewBox="0 0 24">', false],
    ['<svg viewBox="none">', false],
    ['<svg width="24"><symbol viewBox="0 0 24 24"/></svg>', false],
  ])("%s -> %s", (svg, expected) => {
    expect(hasUsableViewBox(svg)).toBe(expected);
  });
});

describe("icon SVG files", () => {
  it("declare a usable viewBox on the root <svg>", () => {
    // Without one the React, React Native, Vue and Svelte builds fall back to
    // "0 0 24 24", so an icon drawn on any other canvas renders cropped in the
    // components even though it looks fine as an <img> on the site.
    const missing: string[] = [];
    for (const variantPath of variantPaths) {
      const file = `${PUBLIC_DIR}${variantPath}`;
      // A missing file is a different failure; this test is only about viewBox.
      if (!existsSync(file)) continue;
      if (!hasUsableViewBox(readFileSync(file, "utf8")))
        missing.push(variantPath);
    }
    expect(missing).toEqual([]);
    // Reads every catalog SVG (thousands of files), so it needs more than the default 5 s.
  }, 120_000);
});
