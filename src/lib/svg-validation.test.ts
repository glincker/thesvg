import { beforeAll, describe, expect, it, vi } from "vitest";
import { validateSvg } from "./svg-validation";

/**
 * The repo has no DOM test environment, so install a minimal DOMParser stand-in
 * that tokenizes tags and decodes numeric character references in attribute
 * values (as a real XML parser would). It supports only what svg-validation
 * touches: querySelectorAll, querySelector, documentElement and attributes.
 */
interface StubAttr {
  name: string;
  value: string;
}
interface StubEl {
  localName: string;
  attributes: StubAttr[];
  hasAttribute(name: string): boolean;
  getAttribute(name: string): string | null;
}

const decodeNumeric = (v: string): string =>
  v
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_m, d: string) => String.fromCodePoint(parseInt(d, 10)));

function makeEl(tag: string): StubEl {
  const name = /^<([^\s/>]+)/.exec(tag)?.[1] ?? "";
  const attributes: StubAttr[] = [];
  for (const m of tag.matchAll(/([^\s=/<>"']+)\s*=\s*"([^"]*)"/g)) {
    attributes.push({ name: m[1], value: decodeNumeric(m[2]) });
  }
  return {
    localName: name.includes(":") ? name.split(":")[1] : name,
    attributes,
    hasAttribute: (n) => attributes.some((a) => a.name === n),
    getAttribute: (n) => attributes.find((a) => a.name === n)?.value ?? null,
  };
}

class StubDOMParser {
  parseFromString(content: string): unknown {
    const els = Array.from(content.matchAll(/<[a-zA-Z][^>]*>/g)).map((m) => makeEl(m[0]));
    return {
      documentElement: els[0],
      querySelectorAll: (sel: string) =>
        sel === "*" ? els : els.filter((e) => e.localName === sel),
      querySelector: () => null,
    };
  }
}

beforeAll(() => {
  vi.stubGlobal("DOMParser", StubDOMParser);
});

const wrap = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><title>Acme</title>${inner}</svg>`;

const scriptCheckPasses = (svg: string): boolean => {
  const result = validateSvg(svg, svg.length);
  const check = result.checks.find((c) => c.name === "No embedded scripts");
  return check?.passed ?? false;
};

describe("validateSvg href handling", () => {
  it("accepts a clean icon", () => {
    const svg = wrap('<path d="M0 0h24v24H0z"/>');
    expect(validateSvg(svg, svg.length).valid).toBe(true);
  });

  it("accepts fragment-only hrefs", () => {
    expect(scriptCheckPasses(wrap('<defs><path id="a" d="M0 0"/></defs><use href="#a"/>'))).toBe(true);
    expect(scriptCheckPasses(wrap('<defs><path id="a" d="M0 0"/></defs><use xlink:href="#a"/>'))).toBe(true);
  });

  it("accepts raster data URIs", () => {
    expect(scriptCheckPasses(wrap('<image href="data:image/png;base64,AAAA"/>'))).toBe(true);
  });

  it.each([
    ["javascript:", '<a href="javascript:alert(1)"><path d="M0 0"/></a>'],
    ["vbscript:", '<a href="vbscript:msgbox(1)"><path d="M0 0"/></a>'],
    ["entity-encoded javascript:", '<a href="&#x6a;avascript:alert(1)"><path d="M0 0"/></a>'],
    ["data:text/html", '<a href="data:text/html,hi"><path d="M0 0"/></a>'],
    ["data:image/svg+xml", '<a xlink:href="data:image/svg+xml,hi"><path d="M0 0"/></a>'],
    ["protocol-relative", '<a href="//evil.com"><path d="M0 0"/></a>'],
    ["use with external href", '<use href="https://evil.com/x.svg#a"/>'],
    ["foreignObject", "<foreignObject><div>hi</div></foreignObject>"],
    ["event handler", '<path onclick="alert(1)" d="M0 0"/>'],
  ])("rejects %s", (_label, inner) => {
    expect(scriptCheckPasses(wrap(inner))).toBe(false);
  });
});
