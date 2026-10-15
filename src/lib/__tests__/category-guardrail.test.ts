import { describe, expect, it } from "vitest";
import iconsData from "@/data/icons.json";

interface Entry {
  slug: string;
  categories: string[];
  dateAdded?: string;
}

// Icons added from this date on must follow the category rules. Older
// entries are cleaned up separately, so they are not checked here.
const ENFORCED_FROM = "2026-10-15";

// Catch-all names that say nothing about what a product does. They may
// still exist on old entries but must not be the primary category of a
// new one.
const GENERIC_PRIMARY = new Set([
  "Software",
  "Platform",
  "General",
  "Other",
  "Services",
  "SaaS",
]);

// Open Source and Self-Hosted are secondary tags, never a primary.
const TAG_ONLY = new Set(["Open Source", "Self-Hosted"]);

// Primary category, one topic, and up to two tags.
const MAX_CATEGORIES = 4;

const added = (iconsData as Entry[]).filter(
  (e) => (e.dateAdded ?? "") >= ENFORCED_FROM,
);

describe("category guardrail for newly added icons", () => {
  it("has entries to check", () => {
    expect(added.length).toBeGreaterThan(0);
  });

  it("never uses a generic category as the primary", () => {
    const bad = added.filter((e) => GENERIC_PRIMARY.has(e.categories[0] ?? ""));
    expect(bad.map((e) => e.slug)).toEqual([]);
  });

  it("never uses a tag as the primary category", () => {
    const bad = added.filter((e) => TAG_ONLY.has(e.categories[0] ?? ""));
    expect(bad.map((e) => e.slug)).toEqual([]);
  });

  it("has at least one category and at most four", () => {
    const bad = added.filter(
      (e) => e.categories.length < 1 || e.categories.length > MAX_CATEGORIES,
    );
    expect(bad.map((e) => e.slug)).toEqual([]);
  });

  it("has no duplicate or padded category names", () => {
    const bad = added.filter(
      (e) =>
        new Set(e.categories).size !== e.categories.length ||
        e.categories.some((c) => c !== c.trim() || c.length === 0),
    );
    expect(bad.map((e) => e.slug)).toEqual([]);
  });
});
