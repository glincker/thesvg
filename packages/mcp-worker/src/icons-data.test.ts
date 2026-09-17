import { describe, it, expect, beforeEach } from "vitest";
import {
  loadIcons,
  searchIcons,
  findIcon,
  buildIconUrl,
  listCategories,
  resetCachesForTests,
  ICON_CDN_BASE,
} from "./icons-data";

beforeEach(() => {
  resetCachesForTests();
});

describe("loadIcons", () => {
  it("loads a non-empty icon index from the bundled registry", () => {
    const icons = loadIcons();
    expect(icons.length).toBeGreaterThan(1000);
  });

  it("maps raw icon fields onto the IconEntry shape", () => {
    const icons = loadIcons();
    const github = icons.find((i) => i.slug === "github");
    expect(github).toBeDefined();
    expect(github?.name).toBeTruthy();
    expect(Array.isArray(github?.variants)).toBe(true);
    expect(github?.variants.length).toBeGreaterThan(0);
  });

  it("caches the index across calls", () => {
    const first = loadIcons();
    const second = loadIcons();
    expect(first).toBe(second);
  });
});

describe("searchIcons", () => {
  it("finds an exact slug match", () => {
    const results = searchIcons("github", 5);
    expect(results.some((r) => r.slug === "github")).toBe(true);
  });

  it("respects the limit parameter", () => {
    const results = searchIcons("a", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("returns an empty array for nonsense queries", () => {
    const results = searchIcons("zzzzzzzznotarealbrandxyz123", 10);
    expect(results).toEqual([]);
  });

  it("returned results include variants and categories", () => {
    const results = searchIcons("github", 1);
    expect(results[0]).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
      variants: expect.any(Array),
      categories: expect.any(Array),
    });
  });
});

describe("findIcon", () => {
  it("finds an icon by exact slug", () => {
    const icon = findIcon("github");
    expect(icon?.slug).toBe("github");
  });

  it("returns undefined for an unknown slug", () => {
    expect(findIcon("this-slug-does-not-exist")).toBeUndefined();
  });
});

describe("buildIconUrl", () => {
  it("builds the expected thesvg.org CDN URL shape", () => {
    expect(buildIconUrl("github", "default")).toBe(
      `${ICON_CDN_BASE}/github/default.svg`
    );
  });

  it("URL-encodes slug and variant", () => {
    expect(buildIconUrl("a b", "c d")).toBe(`${ICON_CDN_BASE}/a%20b/c%20d.svg`);
  });
});

describe("listCategories", () => {
  it("returns categories sorted by descending count", () => {
    const categories = listCategories();
    expect(categories.length).toBeGreaterThan(0);
    for (let i = 1; i < categories.length; i++) {
      expect(categories[i - 1].count).toBeGreaterThanOrEqual(categories[i].count);
    }
  });

  it("counts sum to at least the number of categorized icons", () => {
    const categories = listCategories();
    const total = categories.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBeGreaterThan(0);
  });
});
