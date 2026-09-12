import { test } from "node:test";
import { strict as assert } from "node:assert";

import { svgToJsx } from "./writer.ts";

const cases = [
  { name: "class", in: `<svg class="icon"></svg>`, out: `<svg className="icon"></svg>` },
  { name: "clip-path", in: `<svg clip-path="url(#clip)"></svg>`, out: `<svg clipPath="url(#clip)"></svg>` },
  { name: "fill-rule", in: `<path fill-rule="evenodd"></path>`, out: `<path fillRule="evenodd"></path>` },
  { name: "clip-rule", in: `<path clip-rule="evenodd"></path>`, out: `<path clipRule="evenodd"></path>` },
  { name: "fill-opacity", in: `<path fill-opacity="0.5"></path>`, out: `<path fillOpacity="0.5"></path>` },
  { name: "stroke-width", in: `<path stroke-width="2"></path>`, out: `<path strokeWidth="2"></path>` },
  { name: "stroke-linecap", in: `<path stroke-linecap="round"></path>`, out: `<path strokeLinecap="round"></path>` },
  { name: "stroke-linejoin", in: `<path stroke-linejoin="round"></path>`, out: `<path strokeLinejoin="round"></path>` },
  { name: "stop-color", in: `<stop stop-color="#000"></stop>`, out: `<stop stopColor="#000"></stop>` },
  { name: "stop-opacity", in: `<stop stop-opacity="0.5"></stop>`, out: `<stop stopOpacity="0.5"></stop>` },
  { name: "gradient-units", in: `<linearGradient gradient-units="userSpaceOnUse"></linearGradient>`, out: `<linearGradient gradientUnits="userSpaceOnUse"></linearGradient>` },
  { name: "gradient-transform", in: `<linearGradient gradient-transform="matrix(1 0 0 1 0 0)"></linearGradient>`, out: `<linearGradient gradientTransform="matrix(1 0 0 1 0 0)"></linearGradient>` },
  { name: "xmlns", in: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>`, out: `<svg viewBox="0 0 24 24"></svg>` },
  { name: "xmlns (no space)", in: `<svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 24 24"></svg>`, out: `<svg viewBox="0 0 24 24"></svg>` },
  { name: "multiple replacements", in: `<svg class="icon" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" stroke-width="2"></path></svg>`, out: `<svg className="icon" ><path fillRule="evenodd" strokeWidth="2"></path></svg>` },
];

for (const { name, in: input, out: expected } of cases) {
  test(`handles ${name}`, () => {
    assert.equal(svgToJsx(input), expected);
  });
}
