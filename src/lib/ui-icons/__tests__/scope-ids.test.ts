import { describe, expect, it } from "vitest";
import { GLYPH_BY_SLUG, styleFor } from "../glyphs";
import { renderIcon } from "../engine";
import { scopeIds } from "../scope-ids";

describe("scopeIds", () => {
  it("renames definitions and references together, and only whole ids", () => {
    const out = scopeIds('<g id="a-g"/><g id="a-grid"/><rect fill="url(#a-g)" mask="url(#a-m)"/><mask id="a-m"/>', "u1");
    expect(out).toBe('<g id="a-g-u1"/><g id="a-grid-u1"/><rect fill="url(#a-g-u1)" mask="url(#a-m-u1)"/><mask id="a-m-u1"/>');
  });

  it("leaves markup without ids alone", () => {
    expect(scopeIds('<path d="M0 0"/>', "u1")).toBe('<path d="M0 0"/>');
  });

  it("gives two copies of one glass icon ids that cannot collide, with every reference still resolving", () => {
    const glyph = GLYPH_BY_SLUG.get("layout-grid")!;
    const svg = renderIcon(glyph.nodes, { variant: "glass", style: styleFor("glass"), size: 24, idPrefix: "g-layout-grid-glass" }).svg;
    const a = scopeIds(svg, "r1");
    const b = scopeIds(svg, "r2");
    const idsOf = (s: string): string[] => [...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(idsOf(a).length).toBeGreaterThan(0);
    expect(idsOf(a).filter((id) => idsOf(b).includes(id))).toEqual([]);
    for (const ref of [...a.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1])) expect(idsOf(a)).toContain(ref);
  });
});
