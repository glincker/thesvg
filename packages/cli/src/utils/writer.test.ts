import { test } from "node:test";
import { strict as assert } from "node:assert";

import { svgToJsx } from "./writer.ts";

test("replaces class with className", () => {
  const input = `<svg class="icon"><path class="path"></path></svg>`;
  const expected = `<svg className="icon"><path className="path"></path></svg>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces clip-path with clipPath", () => {
  const input = `<svg clip-path="url(#clip)"><path clip-path="url(#clip2)"></path></svg>`;
  const expected = `<svg clipPath="url(#clip)"><path clipPath="url(#clip2)"></path></svg>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces fill-rule with fillRule", () => {
  const input = `<path fill-rule="evenodd"></path>`;
  const expected = `<path fillRule="evenodd"></path>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces clip-rule with clipRule", () => {
  const input = `<path clip-rule="evenodd"></path>`;
  const expected = `<path clipRule="evenodd"></path>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces fill-opacity with fillOpacity", () => {
  const input = `<path fill-opacity="0.5"></path>`;
  const expected = `<path fillOpacity="0.5"></path>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces stroke-width with strokeWidth", () => {
  const input = `<path stroke-width="2"></path>`;
  const expected = `<path strokeWidth="2"></path>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces stroke-linecap with strokeLinecap", () => {
  const input = `<path stroke-linecap="round"></path>`;
  const expected = `<path strokeLinecap="round"></path>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces stroke-linejoin with strokeLinejoin", () => {
  const input = `<path stroke-linejoin="round"></path>`;
  const expected = `<path strokeLinejoin="round"></path>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces stop-color with stopColor", () => {
  const input = `<stop stop-color="#000"></stop>`;
  const expected = `<stop stopColor="#000"></stop>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces stop-opacity with stopOpacity", () => {
  const input = `<stop stop-opacity="0.5"></stop>`;
  const expected = `<stop stopOpacity="0.5"></stop>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces gradient-units with gradientUnits", () => {
  const input = `<linearGradient gradient-units="userSpaceOnUse"></linearGradient>`;
  const expected = `<linearGradient gradientUnits="userSpaceOnUse"></linearGradient>`;
  assert.equal(svgToJsx(input), expected);
});

test("replaces gradient-transform with gradientTransform", () => {
  const input = `<linearGradient gradient-transform="matrix(1 0 0 1 0 0)"></linearGradient>`;
  const expected = `<linearGradient gradientTransform="matrix(1 0 0 1 0 0)"></linearGradient>`;
  assert.equal(svgToJsx(input), expected);
});

test("removes xmlns attribute", () => {
  const input = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>`;
  const expected = `<svg viewBox="0 0 24 24"></svg>`;
  assert.equal(svgToJsx(input), expected);

  const input2 = `<svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 24 24"></svg>`;
  const expected2 = `<svg viewBox="0 0 24 24"></svg>`;
  assert.equal(svgToJsx(input2), expected2);
});

test("handles multiple replacements in a single SVG string", () => {
  const input = `<svg class="icon" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  const expected = `<svg className="icon" ><path fillRule="evenodd" clipRule="evenodd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>`;
  assert.equal(svgToJsx(input), expected);
});
