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
import { currentOnly } from "../lib/family-current";
import { iconTone } from "../lib/icon-tone";

interface Entry {
  slug: string;
  title: string;
  hex?: string;
  family?: string;
  supersedes?: string;
  supersededBy?: string;
  variants: Record<string, string | undefined>;
}

const MIN_MEMBERS = 4;
const root = resolve(process.cwd());
const toneMap = JSON.parse(
  readFileSync(resolve(root, "src/data/icon-tones.json"), "utf-8"),
) as Record<string, "dark" | "light">;
const icons: Entry[] = JSON.parse(
  readFileSync(resolve(root, "src/data/icons.json"), "utf-8"),
);
const bySlug = new Map(icons.map((i) => [i.slug, i]));
const byFamily = new Map<string, Entry[]>();
for (const icon of icons) {
  if (!icon.family) continue;
  const list = byFamily.get(icon.family) ?? [];
  list.push(icon);
  byFamily.set(icon.family, list);
}
// Same rule as the app: a refreshed mark replaces the older one.
const counts = new Map<string, number>(
  [...byFamily].map(([slug, list]) => [slug, currentOnly(list).length]),
);

const families = [...counts]
  .map(([slug, n]) => ({ slug, count: n + 1, parent: bySlug.get(slug) }))
  .filter((f) => f.parent && f.count >= MIN_MEMBERS)
  .map((f) => ({
    slug: f.slug,
    title: f.parent!.title,
    count: f.count,
    // Light-theme source; the dark source is only set when it differs, the
    // same light/dark rule the icon grid uses.
    logo: f.parent!.variants.light ?? f.parent!.variants.default ?? "",
    // Used by the sidebar to keep near-black or near-white logos visible
    // in the other theme without importing the full registry.
    logoDark:
      f.parent!.variants.dark &&
      f.parent!.variants.dark !== (f.parent!.variants.light ?? f.parent!.variants.default)
        ? f.parent!.variants.dark
        : null,
    tone: toneMap[f.slug] ?? iconTone(f.parent!.hex),
  }))
  .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

writeFileSync(
  resolve(root, "src/data/families.json"),
  JSON.stringify(families, null, 2) + "\n",
);
console.log(`families.json: ${families.length} families`);
