#!/usr/bin/env node
// Fails non-zero if any supersedes/supersededBy link is one-way or points
// at an unknown slug. Run with `node tools/validate-lineage.mjs`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const path = resolve(here, "..", "src", "data", "icons.json");
const data = JSON.parse(readFileSync(path, "utf8"));

if (!Array.isArray(data)) {
  console.error("icons.json is not an array");
  process.exit(1);
}

const bySlug = new Map(data.map((e) => [e.slug, e]));
const issues = [];

for (const e of data) {
  if (e.supersedes && e.supersededBy) {
    issues.push(
      `${e.slug} has both supersedes and supersededBy; an entry cannot be newer and older in the same chain`,
    );
  }
  if (e.supersedes) {
    const target = bySlug.get(e.supersedes);
    if (!target) {
      issues.push(
        `${e.slug}.supersedes points at unknown slug "${e.supersedes}"`,
      );
    } else if (target.supersededBy !== e.slug) {
      issues.push(
        `${e.slug}.supersedes = "${e.supersedes}" but ${target.slug}.supersededBy = "${
          target.supersededBy ?? ""
        }" (expected "${e.slug}")`,
      );
    }
  }
  if (e.supersededBy) {
    const target = bySlug.get(e.supersededBy);
    if (!target) {
      issues.push(
        `${e.slug}.supersededBy points at unknown slug "${e.supersededBy}"`,
      );
    } else if (target.supersedes !== e.slug) {
      issues.push(
        `${e.slug}.supersededBy = "${e.supersededBy}" but ${target.slug}.supersedes = "${
          target.supersedes ?? ""
        }" (expected "${e.slug}")`,
      );
    }
  }
}

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
