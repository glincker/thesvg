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
  it("removes prefixed script and foreignObject by local name", () => {
    const out = sanitizeSvg(
      wrap(
        '<x:script xmlns:x="http://www.w3.org/2000/svg">alert(1)</x:script><X:SCRIPT/><svg:foreignObject><div>hi</div></svg:foreignObject><a:ForeignObject/><path id="keep" d="M1 1"/>',
      ),
    );
    expect(out).not.toMatch(/script|foreignobject|alert|<div>/i);
    expect(out).toContain('id="keep"');
  });

  it("removes animate and set that target href", () => {
    const out = sanitizeSvg(
      wrap(
        '<a href="#x"><animate attributeName="href" values="javascript:alert(1)"/></a>' +
          '<a><set attributeName="xlink:href" to="javascript:alert(2)"></set></a>' +
          '<a><svg:animate attributeName="XLINK:HREF" to="javascript:alert(3)"></svg:animate></a>' +
          '<a><set attributeName="&#104;ref" to="javascript:alert(4)"/></a>',
      ),
    );
    expect(out).not.toMatch(/animate|<set|javascript|alert/i);
  });

  it("keeps animate and set on harmless attributes", () => {
    const svg = wrap(
      '<path d="M0 0"><animate attributeName="opacity" values="0;1" dur="1s"/><set attributeName="fill" to="red"/><animateTransform attributeName="transform" type="rotate" dur="1s"/></path>',
    );
    expect(sanitizeSvg(svg)).toBe(svg);
  });

  it("drops external url() in presentation attributes", () => {
    const out = sanitizeSvg(
      wrap(
        '<path fill="url(http://evil.test/a.svg#g)" d="M0 0"/><path stroke=\'url( "//evil.test/x" )\' filter="url(&#104;ttps://evil.test/f)" d="M1 1"/><path mask="url(data:image/svg+xml;base64,AAAA)" d="M2 2"/>',
      ),
    );
    expect(out).not.toMatch(/evil\.test|data:|fill=|stroke=|filter=|mask=/);
    expect(out).toContain('d="M0 0"');
    expect(out).toContain('d="M2 2"');
  });

  it("keeps fragment url() references", () => {
    const svg = wrap(
      '<defs><linearGradient id="g"/></defs><path fill="url(#g)" stroke="url( \'#g\' )" clip-path="url(&quot;#g&quot;)" style="fill:url(#g);stroke:red" d="M0 0"/>',
    );
    expect(sanitizeSvg(svg)).toBe(svg);
  });

  it("drops external url() declarations from style but keeps the rest", () => {
    const out = sanitizeSvg(
      wrap(
        '<path style="fill:red;background:url(http://evil.test/x);stroke:blue" d="M0 0"/><path style="fill:URL( https://evil.test/y )" d="M1 1"/><path style="fill:u\\72l(http://evil.test/z)" d="M2 2"/>',
      ),
    );
    expect(out).not.toMatch(/evil\.test/);
    expect(out).toContain('style="fill:red;stroke:blue"');
    expect(out).toContain('d="M1 1"');
    expect(out).toContain('d="M2 2"');
  });
});
