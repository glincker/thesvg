import { describe, expect, it } from "vitest";
import { auditSvg } from "../../packages/icons/scripts/lib/audit-svg";

const wrap = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Acme</title>${inner}</svg>`;

const rules = (svg: string): string[] => auditSvg(svg).map((f) => f.rule);

describe("auditSvg", () => {
  it("passes a clean icon", () => {
    const svg = wrap(
      '<defs><path id="a" d="M1 1h4v4z"/></defs><use href="#a"/><use xlink:href="#a"></use><a href="https://example.com"><path d="M2 2"/></a>',
    );
    expect(auditSvg(svg)).toEqual([]);
  });

  it("flags script elements and event handlers", () => {
    expect(rules(wrap("<script>alert(1)</script>"))).toContain("script-tag");
    expect(rules(wrap('<path d="M0 0" onclick="x()"/>'))).toContain("event-handler");
  });

  it("flags javascript: hrefs, including entity encoded", () => {
    expect(rules(wrap('<a href="javascript:alert(1)"><path d="M0 0"/></a>'))).toContain(
      "script-uri",
    );
    expect(rules(wrap('<a href="java&#115;cript:alert(1)"><path d="M0 0"/></a>'))).toContain(
      "unsafe-href",
    );
  });

  it("flags foreignObject", () => {
    expect(rules(wrap('<foreignObject width="1" height="1"><p>x</p></foreignObject>'))).toContain(
      "foreign-object",
    );
  });

  it("flags use with a non-fragment href", () => {
    expect(rules(wrap('<use href="https://evil.example/s.svg#a"/>'))).toContain(
      "use-external-href",
    );
    expect(rules(wrap('<use xlink:href="other.svg#a"/>'))).toContain("use-external-href");
  });

  it("flags protocol-relative hrefs", () => {
    expect(rules(wrap('<a href="//evil.example/x"><path d="M0 0"/></a>'))).toContain(
      "protocol-relative-href",
    );
  });

  it("flags data:image/svg+xml and other non-raster data hrefs", () => {
    expect(
      rules(wrap('<image href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="/>')),
    ).toContain("data-svg-href");
    expect(rules(wrap('<image href="data:text/html,&lt;b&gt;"/>'))).toContain("data-href");
  });

  it("flags embedded raster images", () => {
    expect(rules(wrap('<image href="data:image/png;base64,iVBORw0KGgo="/>'))).toContain(
      "embedded-raster",
    );
  });
});
