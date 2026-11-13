import assert from "node:assert/strict";
import { test } from "node:test";

import { flagHintLines } from "../dist/flag-hint.js";

test("flag results name @thesvg/flags, others get no hint", () => {
  const text = flagHintLines(["github", "flag-de"]).join("\n");
  assert.ok(text.includes("pnpm add @thesvg/flags"));
  assert.ok(text.includes('import { FlagDe } from "@thesvg/flags/react/de"'));
  assert.ok(!text.includes("@thesvg/icons\"") && !text.includes("@thesvg/react\""));
  assert.deepEqual(flagHintLines(["github"]), []);
});
