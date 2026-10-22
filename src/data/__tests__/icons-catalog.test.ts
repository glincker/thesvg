import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import iconsData from "@/data/icons.json";

interface Entry {
  slug: string;
  hex: string;
  url?: string;
  variants: Record<string, string | undefined>;
}

const icons = iconsData as Entry[];
const PUBLIC_DIR = fileURLToPath(new URL("../../../public", import.meta.url));

// validate-svg.yml checks order, hex and duplicates only for slugs a PR adds,
// so drift in older entries goes unnoticed. These run over the whole catalog.
describe("icons.json catalog", () => {
  it("has unique slugs", () => {
    const counts = new Map<string, number>();
    for (const { slug } of icons) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    expect([...counts].filter(([, n]) => n > 1).map(([slug]) => slug)).toEqual([]);
  });

  it("is sorted by slug", () => {
    const outOfOrder = icons
      .slice(1)
      .filter((e, i) => icons[i].slug > e.slug)
      .map((e) => e.slug);
    expect(outOfOrder).toEqual([]);
  });

  it("uses lowercase, hyphen-separated slugs", () => {
    expect(icons.map((e) => e.slug).filter((slug) => !/^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(slug))).toEqual([]);
  });

  it("stores hex as 3 or 6 hex digits without #", () => {
    const bad = icons.filter((e) => !/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(e.hex));
    expect(bad.map((e) => `${e.slug}: ${e.hex}`)).toEqual([]);
  });

  it("gives every icon a default variant", () => {
    expect(icons.filter((e) => !e.variants.default).map((e) => e.slug)).toEqual([]);
  });

  it("points every variant at an SVG file that exists", () => {
    // A wrong path 404s on thesvg.org and drops the variant from the packages
    // that read files by their icons.json path.
    const missing = icons.flatMap((e) =>
      Object.entries(e.variants)
        .filter(([, path]) => !path || !/^\/icons\/.+\.svg$/.test(path) || !existsSync(`${PUBLIC_DIR}${path}`))
        .map(([key, path]) => `${e.slug}/${key}: ${path}`),
    );
    expect(missing).toEqual([]);
  });

  it("links brand sites over https", () => {
    const insecure = icons.filter((e) => e.url && !e.url.startsWith("https://"));
    expect(insecure.map((e) => `${e.slug}: ${e.url}`)).toEqual([]);
  });
});
