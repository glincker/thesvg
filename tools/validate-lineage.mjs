#!/usr/bin/env node
// Fails non-zero if any supersedes/supersededBy link is one-way or points
// at an unknown slug. Run with `node tools/validate-lineage.mjs`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { findLineageIssues } from "./lineage.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const path = resolve(here, "..", "src", "data", "icons.json");
const data = JSON.parse(readFileSync(path, "utf8"));

if (!Array.isArray(data)) {
  console.error("icons.json is not an array");
  process.exit(1);
}

const issues = findLineageIssues(data);

if (issues.length) {
  console.error(`Lineage validation failed with ${issues.length} issue(s):`);
  for (const m of issues) console.error("  " + m);
  process.exit(1);
}

const lineageCount = data.filter(
  (e) => e.supersedes || e.supersededBy,
).length;
console.log(
  `OK: ${data.length} entries scanned, ${lineageCount} with lineage links, no issues`,
);
