import { describe, expect, it } from "vitest";
import { svgText } from "@/components/ui-icons/glyph";
import { GLYPH_BY_SLUG, categoryOf } from "../glyphs";
import { codeFor } from "../snippets";

const idsOf = (svg: string): string[] => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

describe("copied snippets", () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><defs><mask id="a-k"><rect width="24" height="24" fill="#fff"/></mask></defs><path d="M0 0" mask="url(#a-k)"/></svg>';

  it("drop the size from the root only, so masks keep their rectangles", () => {
    for (const tab of ["react", "vue", "svelte"] as const) {
      const code = codeFor(tab, svg, "bell");
      expect(code, tab).not.toMatch(/<svg [^>]*\bwidth=/);
      expect(code, tab).toContain('<rect width="24" height="24"');
    }
  });
});

describe("exported svg text", () => {
  it("gives two different icons ids that cannot collide when both are pasted into one page", () => {
    const a = idsOf(svgText(GLYPH_BY_SLUG.get("bell")!.nodes, "glass", 24, "", {}, "bell"));
    const b = idsOf(svgText(GLYPH_BY_SLUG.get("shield")!.nodes, "glass", 24, "", {}, "shield"));
    expect(a.length).toBeGreaterThan(0);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
  });

  it("keeps the same icon in two looks apart as well", () => {
    const g = GLYPH_BY_SLUG.get("bell")!;
    const glass = idsOf(svgText(g.nodes, "glass", 24, "", {}, "bell"));
    const fill = idsOf(svgText(g.nodes, "fill", 24, "", {}, "bell"));
    expect(glass.filter((id) => fill.includes(id))).toEqual([]);
  });
});

describe("categoryOf", () => {
  it("matches the start of a word, not any substring", () => {
    expect(categoryOf("clock")).toBe("Time");
    expect(categoryOf("lock")).toBe("Security");
    expect(categoryOf("smartphone")).toBe("Devices");
    expect(categoryOf("brain")).not.toBe("Nature");
  });
});
