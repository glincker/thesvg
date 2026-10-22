import { test } from "node:test";
import { strict as assert } from "node:assert";

import { esc, colorize, formatSvgCode } from "../syntax-highlight";

test("esc escapes HTML characters", () => {
  assert.equal(esc("& < > \" '"), "&amp; &lt; &gt; &quot; &#39;");
  assert.equal(esc("<div>Test</div>"), "&lt;div&gt;Test&lt;/div&gt;");
});

test("colorize works for css format", () => {
  const colorizedLine1 = colorize(".icon-github {", "css");
  const colorizedLine2 = colorize("  width: 24px;", "css");

  assert.equal(colorizedLine1, '<span class="text-blue-400">.icon-github</span> {');
  assert.equal(colorizedLine2, '  <span class="text-purple-400">width</span>: <span class="text-green-400">24px</span>;');
});

test("colorize works for html format", () => {
  const htmlCode = '<img src="test.svg" alt="Test" />';
  const colorizedLine = colorize(htmlCode, "html");

  assert.equal(colorizedLine, '&lt;<span class="text-pink-400">img</span> <span class="text-purple-400">src</span>=&quot;test.svg&quot; <span class="text-purple-400">alt</span>=&quot;Test&quot; /&gt;');
});

test("colorize works for default format", () => {
  const reactCode = 'import { Github } from "@thesvg/react";';
  const colorizedLine = colorize(reactCode, "react");

  assert.equal(colorizedLine, '<span class="text-purple-400">import</span> { Github } <span class="text-purple-400">from</span> &quot;@thesvg/react&quot;;');

  const reactCode2 = '<Github variant="default" />';
  const colorizedLine2 = colorize(reactCode2, "react");
  assert.equal(colorizedLine2, '&lt;<span class="text-pink-400">Github</span> <span class="text-orange-300">variant</span>=&quot;<span class="text-purple-400">default</span>&quot; /&gt;');
});

test("formatSvgCode formats raw SVG code", () => {
  const rawSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 22H22L12 2Z" fill="currentColor"/></svg>';
  const expectedSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M12 2L2 22H22L12 2Z" fill="currentColor"/>\n</svg>';

  assert.equal(formatSvgCode(rawSvg), expectedSvg);
});
