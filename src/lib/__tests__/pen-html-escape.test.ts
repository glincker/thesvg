import { describe, it, expect } from "vitest";
import { buildPenHtml } from "../svg-utils";

describe("buildPenHtml comment escaping", () => {
  it("does not let a title close the HTML comment early", () => {
    const html = buildPenHtml("<svg></svg>", "x--><script>alert(1)</script>");
    const end = html.indexOf("(via thesvg.org) -->");
    expect(end).toBeGreaterThan(0);
    expect(html.slice(0, end)).not.toContain("-->");
    expect(html.slice(0, end)).not.toContain("<script>");
    expect(html.indexOf("-->")).toBe(end + "(via thesvg.org) ".length);
  });

  it("escapes every hyphen in the title", () => {
    const html = buildPenHtml("<svg></svg>", "a--!>b---c");
    const end = html.indexOf("(via thesvg.org) -->");
    expect(html.slice("<!--".length, end)).not.toContain("-");
  });
});
