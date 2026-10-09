import { test } from "node:test";
import { strict as assert } from "node:assert";

import { esc } from "./syntax-highlight";

test("esc handles basic string without special characters", () => {
  assert.equal(esc("hello world"), "hello world");
  assert.equal(esc(""), "");
});

test("esc handles HTML special characters", () => {
  assert.equal(esc("&"), "&amp;");
  assert.equal(esc("<"), "&lt;");
  assert.equal(esc(">"), "&gt;");
});

test("esc handles multiple occurrences of special characters", () => {
  assert.equal(esc("a & b & c"), "a &amp; b &amp; c");
  assert.equal(esc("<div></div>"), "&lt;div&gt;&lt;/div&gt;");
});

test("esc handles mixed string with normal and special characters", () => {
  assert.equal(
    esc("<script>alert(1);</script>"),
    "&lt;script&gt;alert(1);&lt;/script&gt;"
  );
});
