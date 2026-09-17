import { describe, it, expect } from "vitest";
import {
  SEARCH_WIDGET_TEMPLATE_URI,
  widgetDescriptorMeta,
  toWidgetIcons,
  buildSearchWidgetHtml,
} from "./widget";

describe("widgetDescriptorMeta", () => {
  it("points openai/outputTemplate at the widget's own resource URI", () => {
    const meta = widgetDescriptorMeta();
    expect(meta["openai/outputTemplate"]).toBe(SEARCH_WIDGET_TEMPLATE_URI);
  });

  it("marks the widget as accessible", () => {
    expect(widgetDescriptorMeta()["openai/widgetAccessible"]).toBe(true);
  });
});

describe("SEARCH_WIDGET_TEMPLATE_URI", () => {
  it("uses the ui:// scheme required by the Apps SDK", () => {
    expect(SEARCH_WIDGET_TEMPLATE_URI.startsWith("ui://widget/")).toBe(true);
    expect(SEARCH_WIDGET_TEMPLATE_URI.endsWith(".html")).toBe(true);
  });
});

describe("toWidgetIcons", () => {
  const buildUrl = (slug: string, variant: string) =>
    `https://thesvg.org/icons/${slug}/${variant}.svg`;

  it("prefers the default variant when available", () => {
    const [icon] = toWidgetIcons(
      [{ slug: "github", name: "GitHub", variants: ["mono", "default"] }],
      buildUrl
    );
    expect(icon.url).toBe("https://thesvg.org/icons/github/default.svg");
  });

  it("falls back to the first variant when default is unavailable", () => {
    const [icon] = toWidgetIcons(
      [{ slug: "acme", name: "Acme", variants: ["mono", "light"] }],
      buildUrl
    );
    expect(icon.url).toBe("https://thesvg.org/icons/acme/mono.svg");
  });

  it("maps every input result to an output icon", () => {
    const results = [
      { slug: "a", name: "A", variants: ["default"] },
      { slug: "b", name: "B", variants: ["default"] },
    ];
    expect(toWidgetIcons(results, buildUrl)).toHaveLength(2);
  });
});

describe("buildSearchWidgetHtml", () => {
  it("declares the text/html+skybridge-compatible shell and reads window.openai.toolOutput", () => {
    const html = buildSearchWidgetHtml();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("window.openai");
    expect(html).toContain("toolOutput");
  });
});
