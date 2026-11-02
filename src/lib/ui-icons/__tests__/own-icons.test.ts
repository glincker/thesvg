import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GLYPH_BY_SLUG } from "../glyphs";

const source = readFileSync("src/components/own-icons.tsx", "utf8");
const mapped = [...source.matchAll(/= make\("([^"]+)"/g)].map((m) => m[1]);

describe("own icon adapter", () => {
  it("maps at least the icons the site uses", () => {
    expect(mapped.length).toBeGreaterThan(100);
  });

  it("only maps to glyphs that exist, so a typo cannot silently drop an icon", () => {
    const missing = mapped.filter((slug) => !GLYPH_BY_SLUG.has(slug));
    expect(missing).toEqual([]);
  });
});
