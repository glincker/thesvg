import { test } from "node:test";
import { strict as assert } from "node:assert";

import { RESERVED_IDENTIFIERS, toSafeIdentifier } from "./safe-identifier.ts";

test("passes a normal alphanumeric slug through unchanged", () => {
  assert.equal(toSafeIdentifier("github"), "github");
  assert.equal(toSafeIdentifier("react"), "react");
  assert.equal(toSafeIdentifier("vercel"), "vercel");
});

test("replaces hyphens with underscores", () => {
  assert.equal(toSafeIdentifier("react-native"), "react_native");
  assert.equal(toSafeIdentifier("aws-amazon-s3"), "aws_amazon_s3");
});

test("replaces dots with underscores", () => {
  assert.equal(toSafeIdentifier("01.ai"), "i_01_ai");
  assert.equal(toSafeIdentifier("nuxt.js"), "nuxt_js");
});

test("prefixes leading-digit slugs with i_", () => {
  assert.equal(toSafeIdentifier("01dotai"), "i_01dotai");
  assert.equal(toSafeIdentifier("1password"), "i_1password");
  assert.equal(toSafeIdentifier("4chan"), "i_4chan");
});

test("escapes the await reserved word (the original PR 503 bug)", () => {
  assert.equal(toSafeIdentifier("await"), "i_await");
});

test("escapes strict-mode restricted bindings arguments and eval", () => {
  assert.equal(toSafeIdentifier("arguments"), "i_arguments");
  assert.equal(toSafeIdentifier("eval"), "i_eval");
});

test("escapes every reserved word in the set", () => {
  for (const word of RESERVED_IDENTIFIERS) {
    assert.equal(
      toSafeIdentifier(word),
      `i_${word}`,
      `reserved word "${word}" should be prefixed`,
    );
  }
});

test("escapes future-reserved words that may show up as slugs", () => {
  assert.equal(toSafeIdentifier("class"), "i_class");
  assert.equal(toSafeIdentifier("for"), "i_for");
  assert.equal(toSafeIdentifier("new"), "i_new");
  assert.equal(toSafeIdentifier("default"), "i_default");
  assert.equal(toSafeIdentifier("yield"), "i_yield");
});

test("does not escape words that merely contain a reserved word", () => {
  assert.equal(toSafeIdentifier("classroom"), "classroom");
  assert.equal(toSafeIdentifier("foreach"), "foreach");
  assert.equal(toSafeIdentifier("newrelic"), "newrelic");
});

test("handles slugs that become reserved after non-word stripping", () => {
  assert.equal(toSafeIdentifier("class"), "i_class");
});

test("is idempotent for already-safe identifiers", () => {
  const safe = toSafeIdentifier("react");
  assert.equal(toSafeIdentifier(safe), safe);
});
