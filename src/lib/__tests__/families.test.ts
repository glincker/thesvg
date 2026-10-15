import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getAllIcons, getIconBySlug } from "@/lib/icons";
import {
  FAMILY_MIN_MEMBERS,
  getFamilyMembers,
  getFamilySlugFor,
  getFamilySummaries,
  pickFamilySiblings,
} from "@/lib/families";

describe("brand families", () => {
  it("points every family at an existing parent brand icon", () => {
    const bad = getAllIcons()
      .filter((i) => i.family)
      .filter((i) => {
        const parent = getIconBySlug(i.family as string);
        return !parent || parent.collection !== "brands";
      });
    expect(bad.map((i) => i.slug)).toEqual([]);
  });

  it("never nests: a parent has no family of its own", () => {
    const parents = new Set(
      getAllIcons().flatMap((i) => (i.family ? [i.family] : [])),
    );
    const nested = [...parents].filter((p) => getIconBySlug(p)?.family);
    expect(nested).toEqual([]);
  });

  it("only gives a family page to parents with enough members", () => {
    for (const f of getFamilySummaries()) {
      expect(f.count).toBeGreaterThanOrEqual(FAMILY_MIN_MEMBERS);
    }
  });

  it("includes the parent first in getFamilyMembers", () => {
    const first = getFamilyMembers("amazon")[0];
    expect(first?.slug).toBe("amazon");
  });

  it("resolves the family for a parent and for a child", () => {
    const parent = getIconBySlug("amazon");
    const child = getIconBySlug("amazon-kindle");
    expect(parent && getFamilySlugFor(parent)).toBe("amazon");
    expect(child && getFamilySlugFor(child)).toBe("amazon");
  });

  it("picks a small sibling set that excludes the icon itself", () => {
    const kindle = getIconBySlug("amazon-kindle");
    if (!kindle) throw new Error("amazon-kindle missing");
    const picked = pickFamilySiblings(getFamilyMembers("amazon"), kindle);
    expect(picked.length).toBeLessThanOrEqual(6);
    expect(picked.map((p) => p.slug)).not.toContain("amazon-kindle");
  });

  it("keeps the sidebar families.json in sync with icons.json", () => {
    const file = JSON.parse(
      readFileSync(resolve(process.cwd(), "src/data/families.json"), "utf-8"),
    ) as { slug: string; count: number }[];
    const live = getFamilySummaries().map((f) => ({
      slug: f.slug,
      count: f.count,
    }));
    expect(file.map((f) => ({ slug: f.slug, count: f.count }))).toEqual(live);
  });
});
