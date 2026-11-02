import { describe, expect, it } from "vitest";
import outline from "@/data/ui/looks/outline.json";
import glassOutline from "@/data/ui/looks/glass-outline.json";
import { ANIMATED, ANIMATED_SLUGS, PRESETS, animate, animateSvg } from "../../../../scripts/ui/anim-runtime.mjs";

type Looks = Record<string, string>;
const move = (html: string, uid: string, kind?: string | boolean) => animate(html, uid, kind) as { cls: string; html: string };

describe("icon motion", () => {
  it("wraps the markup in a scoped group with its own style", () => {
    const out = move('<g stroke="currentColor"><path d="M0 0L1 1"/></g><defs><mask id="m"/></defs>', "u7");
    expect(out.cls).toBe("ua-u7");
    expect(out.html.startsWith("<style>")).toBe(true);
    expect(out.html).toContain('<g class="ua-u7">');
    expect(out.html).toContain('<path pathLength="1" d="M0 0L1 1"/>');
    expect(out.html).not.toContain("<mask pathLength");
  });

  it("keeps two icons on a page from sharing a class", () => {
    expect(move("<path/>", "a").html).toContain(".ua-a{");
    expect(move("<path/>", "b").html).not.toContain(".ua-a{");
  });

  it("treats true and an unknown name as draw", () => {
    const base = move("<path/>", "x").html;
    expect(move("<path/>", "x", true).html).toBe(base);
    expect(move("<path/>", "x", "nope").html).toBe(base);
  });

  it.each(PRESETS as string[])("%s respects reduced motion", (kind) => {
    expect(move("<path/>", "x", kind).html).toContain("prefers-reduced-motion:reduce");
  });

  it("only draw changes the stroke length, and only the loops run forever", () => {
    for (const kind of PRESETS as string[]) {
      const html = move("<path/>", "x", kind).html;
      expect(html.includes('pathLength="1"'), kind).toBe(kind === "draw");
      expect(html.includes("infinite"), kind).toBe(kind === "spin" || kind === "pulse");
    }
  });

  it("animates a whole svg file and leaves the root element as it was", () => {
    const svg = (outline as Looks)["sun"] ?? "";
    const out = animateSvg(svg, "pulse") as string;
    expect(out.startsWith(svg.slice(0, svg.indexOf(">") + 1))).toBe(true);
    expect(out.endsWith("</svg>")).toBe(true);
    expect(out.match(/<svg/g)).toHaveLength(1);
    expect(out).toContain('<g class="ua">');
    expect(out).toContain("ua-pulse");
  });

  it("only maps icons that exist, to presets that exist", () => {
    expect(ANIMATED_SLUGS).toEqual(Object.keys(ANIMATED));
    for (const [slug, kind] of Object.entries(ANIMATED as Record<string, string>)) {
      expect((outline as Looks)[slug], slug).toBeTruthy();
      expect((glassOutline as Looks)[slug], slug).toBeTruthy();
      expect(PRESETS, slug).toContain(kind);
    }
  });
});
