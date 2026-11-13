import assert from "node:assert/strict";
import { test } from "node:test";

import { EXCLUDED_COLLECTIONS, filterPackaged, isPackaged } from "./catalog.ts";

test("flags are excluded from the generic packages and everything else is kept", () => {
  assert.ok(EXCLUDED_COLLECTIONS.includes("flags"));
  assert.equal(isPackaged({ collection: "flags" }), false);
  for (const c of ["brands", "aws", "azure", "gcp", "k8s", "community", "auth-badges"]) assert.equal(isPackaged({ collection: c }), true, c);
  assert.equal(isPackaged({}), true);
});

test("filterPackaged returns catalog minus excluded collections in order", () => {
  const icons = [{ slug: "a", collection: "brands" }, { slug: "flag-us", collection: "flags" }, { slug: "b", collection: "aws" }];
  assert.deepEqual(filterPackaged(icons).map((i) => i.slug), ["a", "b"]);
});
