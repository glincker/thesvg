import assert from "node:assert/strict";
import { test } from "node:test";

import { flagHint } from "../../src/utils/flag-hint.js";

test("flag results point at @thesvg/flags and the per-flag import", () => {
  const h = flagHint(["github", "flag-gb-eng"]);
  assert.ok(h?.includes("@thesvg/flags"));
  assert.ok(h?.includes('import { FlagGbEng } from "@thesvg/flags/react/gb-eng"'));
  assert.ok(!h?.includes("@thesvg/icons"));
});

test("non-flag results get no hint", () => {
  assert.equal(flagHint(["github", "aws-amazon-s3"]), undefined);
});
