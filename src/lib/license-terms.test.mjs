import test from "node:test";
import assert from "node:assert/strict";
import { requiresUnmodifiedSvg } from "./license-terms.mjs";

test("flags licenses that forbid modification", () => {
  for (const l of [
    "CC-BY-ND-2.0",
    "Custom owner permission (issue #1305): unchanged official logo",
    "Use the unaltered logo only",
    "unmodified redistribution authorized",
  ]) assert.equal(requiresUnmodifiedSvg(l), true, l);
});

test("leaves open and plain trademark licenses alone", () => {
  for (const l of ["CC0-1.0", "MIT", "Trademark", "brand-use", "", undefined])
    assert.equal(requiresUnmodifiedSvg(l), false, String(l));
});
