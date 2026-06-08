/**
 * Tests for the submission license selector validator.
 *
 * No test runner dep — uses Node's built-in `node:test` (Node ≥ 20).
 * Run with: `node --test --experimental-strip-types src/lib/license-options.test.mjs`
 * or via the eponymous wrapper script if the package adds one later.
 *
 * The tests target the pure validator only; UI behavior is exercised
 * separately when the page is opened in a browser.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  LICENSE_OPTIONS,
  MAX_OTHER_LICENSE_LENGTH,
  OTHER_LICENSE_ID,
  validateLicenseSelection,
} from "./license-options.ts";

test("LICENSE_OPTIONS has unique ids", () => {
  const ids = LICENSE_OPTIONS.map((o) => o.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, "duplicate license id found");
});

test("LICENSE_OPTIONS contains the well-known SPDX ids we expect", () => {
  const ids = new Set(LICENSE_OPTIONS.map((o) => o.id));
  // Locking these in so a future refactor can't silently drop one and
  // break the public icons.json contract.
  for (const required of [
    "CC0-1.0",
    "MIT",
    "Apache-2.0",
    "BSD-3-Clause",
    "ISC",
    "CC-BY-4.0",
    "CC-BY-SA-4.0",
    "CC-BY-ND-4.0",
    "MPL-2.0",
    "Unlicense",
    "Other",
  ]) {
    assert.ok(ids.has(required), `missing license id: ${required}`);
  }
});

test("exactly one option is the triage escape hatch", () => {
  const triaged = LICENSE_OPTIONS.filter((o) => o.needsTriage);
  assert.equal(triaged.length, 1);
  assert.equal(triaged[0].id, OTHER_LICENSE_ID);
});

test("empty selection is rejected as missing", () => {
  const r = validateLicenseSelection("", "");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "missing");
});

test("whitespace-only selection is rejected as missing", () => {
  const r = validateLicenseSelection("   ", "");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "missing");
});

test("non-string license id is rejected (defensive)", () => {
  // Simulating a tampered or programmatic call
  const r = validateLicenseSelection(undefined, "");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "missing");
});

test("unknown license id is rejected", () => {
  const r = validateLicenseSelection("GPL-99", "");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "unknown");
});

test("each accepted license resolves to its id and is not triaged", () => {
  for (const opt of LICENSE_OPTIONS) {
    if (opt.id === OTHER_LICENSE_ID) continue;
    const r = validateLicenseSelection(opt.id, "");
    assert.equal(r.ok, true, `${opt.id} should be accepted`);
    if (r.ok) {
      assert.equal(r.resolved, opt.id);
      assert.equal(r.needsTriage, false);
    }
  }
});

test("Other without description is rejected", () => {
  const r = validateLicenseSelection(OTHER_LICENSE_ID, "");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "other_empty");
});

test("Other with whitespace-only description is rejected", () => {
  const r = validateLicenseSelection(OTHER_LICENSE_ID, "   \t  ");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "other_empty");
});

test("Other with description resolves to the trimmed text and is triaged", () => {
  const r = validateLicenseSelection(
    OTHER_LICENSE_ID,
    "  Acme Brand Guidelines v2 — non-commercial only  ",
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.resolved, "Acme Brand Guidelines v2 — non-commercial only");
    assert.equal(r.needsTriage, true);
  }
});

test("Other with description over MAX length is rejected", () => {
  const tooLong = "x".repeat(MAX_OTHER_LICENSE_LENGTH + 1);
  const r = validateLicenseSelection(OTHER_LICENSE_ID, tooLong);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "other_too_long");
});

test("Other with description at exactly MAX length is accepted", () => {
  const max = "x".repeat(MAX_OTHER_LICENSE_LENGTH);
  const r = validateLicenseSelection(OTHER_LICENSE_ID, max);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.resolved.length, MAX_OTHER_LICENSE_LENGTH);
  }
});
