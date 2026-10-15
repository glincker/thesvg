/**
 * Regenerates src/data/families.json, the small family list the sidebar
 * reads on the client so it does not need to import the full registry.
 *
 *   pnpm tsx src/scripts/generate-families.ts
 *
 * A test fails when the committed file drifts from icons.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface Entry {
  slug: string;
  title: string;
  family?: string;
  variants: Record<string, string | undefined>;
}

const MIN_MEMBERS = 4;
const root = resolve(process.cwd());
const icons: Entry[] = JSON.parse(
  readFileSync(resolve(root, "src/data/icons.json"), "utf-8"),
);
const bySlug = new Map(icons.map((i) => [i.slug, i]));
const counts = new Map<string, number>();
for (const icon of icons) {
  if (icon.family) counts.set(icon.family, (counts.get(icon.family) ?? 0) + 1);
}

const families = [...counts]
  .map(([slug, n]) => ({ slug, count: n + 1, parent: bySlug.get(slug) }))
  .filter((f) => f.parent && f.count >= MIN_MEMBERS)
  .map((f) => ({
    slug: f.slug,
    title: f.parent!.title,
    count: f.count,
    logo: f.parent!.variants.default ?? "",
  }))
  .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

writeFileSync(
  resolve(root, "src/data/families.json"),
  JSON.stringify(families, null, 2) + "\n",
);
console.log(`families.json: ${families.length} families`);
