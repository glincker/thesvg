import { describe, expect, it } from "vitest";
import outline from "@/data/ui/looks/outline.json";
import glassOutline from "@/data/ui/looks/glass-outline.json";
import { ANIMATED_SLUGS, animate, animateSvg } from "../../../../scripts/ui/anim-runtime.mjs";

type Looks = Record<string, string>;

describe("animated UI icons", () => {
  it("wraps the markup in a scoped group with its own style", () => {
    const out = animate('<g stroke="currentColor"><path d="M0 0L1 1"/></g><defs><mask id="m"/></defs>', "u7") as { cls: string; html: string };
    expect(out.cls).toBe("ua-u7");
    expect(out.html.startsWith("<style>")).toBe(true);
    expect(out.html).toContain('<g class="ua-u7">');
    expect(out.html).toContain('<path pathLength="1" d="M0 0L1 1"/>');
    // Only drawing shapes get a length, other tags are left alone.
    expect(out.html).not.toContain('<mask pathLength');
    expect(out.html).not.toContain('<g pathLength');
  });

  it("keeps two icons on a page from sharing a class", () => {
    const a = animate("<path/>", "a") as { html: string };
    const b = animate("<path/>", "b") as { html: string };
    expect(a.html).toContain(".ua-a{");
    expect(b.html).toContain(".ua-b{");
    expect(a.html).not.toContain(".ua-b{");
  });

  it("respects reduced motion", () => {
    const { html } = animate("<path/>", "x") as { html: string };
    expect(html).toContain("prefers-reduced-motion:reduce");
  });

  it("animates a whole svg file and leaves the root element as it was", () => {
    const svg = (outline as Looks)["sun"] ?? "";
    const out = animateSvg(svg) as string;
    expect(out.startsWith(svg.slice(0, svg.indexOf(">") + 1))).toBe(true);
    expect(out.endsWith("</svg>")).toBe(true);
    expect(out.match(/<svg/g)).toHaveLength(1);
    expect(out).toContain('<g class="ua">');
  });

  it("covers the theme icons in every look that exists", () => {
    expect(ANIMATED_SLUGS).toEqual(["sun", "moon", "theme-system"]);
    for (const slug of ANIMATED_SLUGS as string[]) {
      expect((outline as Looks)[slug], slug).toBeTruthy();
      expect((glassOutline as Looks)[slug], slug).toBeTruthy();
    }
  });
});
