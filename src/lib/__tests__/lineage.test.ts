import { describe, expect, it } from "vitest";

import iconsData from "@/data/icons.json";
import { findLineageIssues } from "../../../tools/lineage.mjs";

describe("findLineageIssues", () => {
  it("accepts a link recorded on both entries", () => {
    expect(
      findLineageIssues([
        { slug: "acme", supersedes: "acme-legacy" },
        { slug: "acme-legacy", supersededBy: "acme" },
      ]),
    ).toEqual([]);
  });

  it("reports a supersededBy that the newer entry does not mirror", () => {
    expect(findLineageIssues([{ slug: "acme" }, { slug: "acme-legacy", supersededBy: "acme" }])).toEqual([
      'acme-legacy.supersededBy = "acme" but acme.supersedes = "" (expected "acme-legacy")',
    ]);
  });

  it("reports a link to a slug that does not exist", () => {
    expect(findLineageIssues([{ slug: "acme", supersedes: "gone" }])).toEqual([
      'acme.supersedes points at unknown slug "gone"',
    ]);
  });

  it("reports an entry that is both newer and older", () => {
    expect(
      findLineageIssues([
        { slug: "a", supersededBy: "b" },
        { slug: "b", supersedes: "a", supersededBy: "c" },
        { slug: "c", supersedes: "b" },
      ]),
    ).toEqual([
      "b has both supersedes and supersededBy; an entry cannot be newer and older in the same chain",
    ]);
  });
});

describe("icons.json lineage", () => {
  it("records every supersedes/supersededBy link on both entries", () => {
    // CONTRIBUTING.md requires both sides to agree; the detail page renders
    // the cross-link card from them.
    expect(findLineageIssues(iconsData)).toEqual([]);
  });
});
