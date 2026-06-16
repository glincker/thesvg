/**
 * Smoke test for the thesvg MCP server data layer.
 * Run with: node test-smoke.mjs
 * Requires: npm run build first.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import Fuse from "fuse.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load bundled icons.json from dist
const iconsPath = path.join(__dirname, "dist", "icons.json");
const raw = require(iconsPath);

console.log(`Loaded ${raw.length} icons from bundled registry.`);
assert(raw.length > 6000, `Expected 6000+ icons, got ${raw.length}`);

// Build index (mirrors logic in src/index.ts)
const index = raw.map((icon) => ({
  slug: icon.slug,
  name: icon.title,
  variants: Object.keys(icon.variants ?? {}),
  categories: icon.categories ?? [],
  aliases: icon.aliases ?? [],
}));

// Build Fuse index
const fuse = new Fuse(index, {
  keys: [
    { name: "slug", weight: 0.4 },
    { name: "name", weight: 0.4 },
    { name: "aliases", weight: 0.2 },
  ],
  threshold: 0.35,
  includeScore: true,
});

// Test: search for "github"
const githubResults = fuse.search("github", { limit: 20 });
console.log(`searchIcons("github") returned ${githubResults.length} results:`);
assert(githubResults.length >= 1, "Expected at least 1 result for 'github'");
for (const r of githubResults) {
  console.log(`  - ${r.item.name} (${r.item.slug}) score=${r.score?.toFixed(3)}`);
}

// Test: search for "stripe"
const stripeResults = fuse.search("stripe", { limit: 5 });
console.log(`\nsearchIcons("stripe") returned ${stripeResults.length} results:`);
assert(stripeResults.length >= 1, "Expected at least 1 result for 'stripe'");
assert(
  stripeResults[0].item.slug === "stripe",
  `Expected top result to be 'stripe', got '${stripeResults[0].item.slug}'`
);

// Test: list_variants equivalent
const openai = index.find((i) => i.slug === "openai");
assert(openai, "Expected 'openai' icon to exist");
console.log(
  `\nlist_variants("openai"): ${openai.variants.join(", ")}`
);
assert(openai.variants.length >= 1, "Expected openai to have at least 1 variant");

// Test: CDN URL construction
const CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@v0.6.0/public/icons";
const url = `${CDN_BASE}/github/default.svg`;
assert(
  url === "https://cdn.jsdelivr.net/gh/glincker/thesvg@v0.6.0/public/icons/github/default.svg",
  `Unexpected CDN URL: ${url}`
);
console.log(`\nget_icon_url("github", "default") => ${url}`);

// Test: category count
const counts = new Map();
for (const icon of index) {
  for (const cat of icon.categories) {
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
}
console.log(`\nlist_categories(): ${counts.size} categories found`);
assert(counts.size > 5, `Expected more than 5 categories, got ${counts.size}`);

console.log("\nAll smoke tests passed.");

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}
