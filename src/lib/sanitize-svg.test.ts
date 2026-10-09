import { describe, expect, it } from "vitest";
import { sanitizeSvg } from "../../packages/icons/scripts/lib/sanitize-svg";

const wrap = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Acme</title>${inner}</svg>`;

describe("sanitizeSvg", () => {
  it("leaves a valid icon unchanged", () => {
    const svg = wrap(
      '<defs><path id="a" d="M0 0h24v24H0z"/></defs><use href="#a"/><use xlink:href="#a"></use><a href="https://example.com"><path d="M1 1"/></a>',
    );
    expect(sanitizeSvg(svg)).toBe(svg);
  });

  it("removes script in case variants", () => {
    const out = sanitizeSvg(wrap("<ScRiPt>alert(1)</sCrIpT><SCRIPT type='x'>a</SCRIPT>"));
    expect(out.toLowerCase()).not.toContain("script");
    expect(out).toContain("<title>Acme</title>");
  });

  it("removes self-closing script without eating following content", () => {
    const out = sanitizeSvg(wrap('<script/><path id="keep" d="M1 1"/>'));
    expect(out).not.toMatch(/script/i);
    expect(out).toContain('id="keep"');
  });

  it("strips unquoted and quoted on* handlers inside tags", () => {
    const out = sanitizeSvg(
      '<svg onload=alert(1) viewBox="0 0 1 1"><path ONCLICK="x()" onmouseover=\'y()\' d="M0 0"/></svg>',
    );
    expect(out).not.toMatch(/on(load|click|mouseover)/i);
    expect(out).toContain('viewBox="0 0 1 1"');
    expect(out).toContain('d="M0 0"');
    expect(out.endsWith("/></svg>")).toBe(true);
  });

  it("does not touch on* text in content or title", () => {
    const svg = wrap("").replace("<title>Acme</title>", "<title>onload=1 Acme</title>");
    expect(sanitizeSvg(svg)).toBe(svg);
  });

  it("removes foreignObject", () => {
    const out = sanitizeSvg(wrap("<foreignObject><div>hi</div></foreignObject><FOREIGNOBJECT/>"));
    expect(out).not.toMatch(/foreignobject/i);
    expect(out).not.toContain("<div>");
  });

  it("removes use elements with external href", () => {
    const out = sanitizeSvg(
      wrap('<use href=http://evil.test/x.svg#a/><use xlink:href="https://evil.test/a.svg#b"></use><use href="#ok"/>'),
    );
    expect(out).not.toContain("evil.test");
    expect(out).toContain('<use href="#ok"/>');
  });

  it("rejects javascript: even when entity obfuscated", () => {
    for (const href of [
      "javascript:alert(1)",
      "&#x6a;avascript:alert(1)",
      "&#106;avascript:alert(1)",
      "jav&#x09;ascript:alert(1)",
      "java&Tab;script&colon;alert(1)",
    ]) {
      const out = sanitizeSvg(wrap(`<a href="${href}"><path d="M0 0"/></a>`));
      expect(out).not.toMatch(/javascript|&#x6a|&#106|alert/i);
      expect(out).toContain('d="M0 0"');
    }
  });

  it("rejects data:image/svg+xml and protocol-relative hrefs", () => {
    const out = sanitizeSvg(
      wrap('<a href="data:image/svg+xml;base64,AAAA"/><a xlink:href="//evil.test/x"/><use href="//evil.test/y#a"/>'),
    );
    expect(out).not.toContain("data:");
    expect(out).not.toContain("evil.test");
  });
});
