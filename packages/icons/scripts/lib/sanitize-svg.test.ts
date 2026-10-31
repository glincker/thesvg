import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeSvg } from "./sanitize-svg";

test("removes script tags", () => {
  const result = sanitizeSvg("<svg><script>alert(1)</script></svg>");
  assert.match(result, /^<svg\s*\/?>(?:<\/svg>)?$/);
});

test("removes foreignObject tags", () => {
  const result = sanitizeSvg("<svg><foreignObject><script>alert(1)</script></foreignObject></svg>");
  assert.match(result, /^<svg\s*\/?>(?:<\/svg>)?$/);
});

test("removes event handlers", () => {
  assert.equal(sanitizeSvg("<svg><g onload=\"alert(1)\" onclick=\"alert(2)\" onmouseover=\"alert(3)\"></g></svg>"), "<svg><g/></svg>");
});

test("removes unsafe href values in <a>", () => {
  assert.equal(sanitizeSvg("<svg><a href=\"javascript:alert(1)\">Link</a></svg>"), "<svg><a>Link</a></svg>");
  assert.equal(sanitizeSvg("<svg><a href=\"vbscript:alert(1)\">Link</a></svg>"), "<svg><a>Link</a></svg>");
});

test("handles HTML entity encoded unsafe href values", () => {
  assert.equal(sanitizeSvg("<svg><a href=\"&#106;avascript:alert(1)\">Link</a></svg>"), "<svg><a>Link</a></svg>");
});

test("removes unsafe <use> hrefs not starting with #", () => {
  let result = sanitizeSvg("<svg><use href=\"external.svg#icon\"/></svg>");
  assert.match(result, /^<svg\s*\/?>(?:<\/svg>)?$/);

  result = sanitizeSvg("<svg><use xlink:href=\"http://example.com/icon.svg#test\"/></svg>");
  assert.match(result, /^<svg\s*\/?>(?:<\/svg>)?$/);

  assert.equal(sanitizeSvg("<svg><use href=\"#local\"/></svg>"), "<svg><use href=\"#local\"/></svg>");
});

test("preserves safe SVG", () => {
  const safe = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z" fill="currentColor"/></svg>`;
  // jsdom might change formatting, let's normalize formatting for comparison
  const norm1 = sanitizeSvg(safe).replace(/ \/>/g, '/>');
  const norm2 = safe.replace(/ \/>/g, '/>');
  assert.equal(norm1, norm2);
});
