/**
 * enrich-svgl-variants.ts
 *
 * Fills missing light/dark/wordmark SVG variant slots in our icons.json
 * by pulling matching SVGs from a local clone of the svgl repo.
 *
 * Usage:
 *   tsx  scripts/enrich-svgl-variants.ts [--svgl-path /path/to/svgl]
 *   bun  scripts/enrich-svgl-variants.ts [--svgl-path /path/to/svgl]
 *
 * Defaults:
 *   --svgl-path defaults to the sibling clone at
 *   <repo-root>/../../askverdict-app/askverdict/svgl
 *   (adjust via CLI arg or SVGL_PATH env var)
 *
 * The script is idempotent: running it twice produces the same result.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the packages/icons package */
const PKG_ROOT = resolve(__dirname, "..");
/** Root of the thesvg monorepo */
const REPO_ROOT = resolve(PKG_ROOT, "../..");

const ICONS_JSON_PATH = join(REPO_ROOT, "src/data/icons.json");
const PUBLIC_ICONS_DIR = join(REPO_ROOT, "public/icons");

/** Resolve --svgl-path CLI arg or SVGL_PATH env var, falling back to default */
function resolveSvglRoot(): string {
  const argIdx = process.argv.indexOf("--svgl-path");
  if (argIdx !== -1 && process.argv[argIdx + 1]) {
    return resolve(process.argv[argIdx + 1]);
  }
  if (process.env["SVGL_PATH"]) {
    return resolve(process.env["SVGL_PATH"]);
  }
  // Default: sibling clone
  return resolve(REPO_ROOT, "../../askverdict-app/askverdict/svgl");
}

const SVGL_ROOT = resolveSvglRoot();
const SVGL_LIBRARY_DIR = join(SVGL_ROOT, "static/library");
const SVGL_DATA_FILE = join(SVGL_ROOT, "src/data/svgs.ts");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Our icons.json shape */
interface IconVariants {
  default?: string;
  mono?: string;
  light?: string;
  dark?: string;
  wordmark?: string;
  wordmarkLight?: string;
  wordmarkDark?: string;
  color?: string;
  [key: string]: string | undefined;
}

interface OurIcon {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: IconVariants;
  license: string;
  url: string;
  guidelines?: string;
}

/** svgl iSVG shape (inlined so we have no dependency on the svgl package) */
interface SvglThemeOptions {
  light: string;
  dark: string;
}

interface SvglEntry {
  title: string;
  route: string | SvglThemeOptions;
  wordmark?: string | SvglThemeOptions;
  url: string;
}

/** A fully parsed set of candidate SVG paths extracted from one svgl entry */
interface SvglVariantCandidates {
  light?: string;
  dark?: string;
  wordmark?: string;
  wordmarkLight?: string;
  wordmarkDark?: string;
}

/** Quality check result */
type QualityResult =
  | { ok: true }
  | { ok: false; reason: string };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max allowed SVG file size (bytes) */
const MAX_SVG_BYTES = 50 * 1024; // 50 KB

/** Our target variant keys that can be enriched from svgl */
const ENRICHABLE_VARIANTS = [
  "light",
  "dark",
  "wordmark",
  "wordmarkLight",
  "wordmarkDark",
] as const;

type EnrichableVariant = (typeof ENRICHABLE_VARIANTS)[number];

// ---------------------------------------------------------------------------
// SVG quality guard
// ---------------------------------------------------------------------------

function checkSvgQuality(svgPath: string): QualityResult {
  let content: string;
  try {
    const stat = statSync(svgPath);
    if (stat.size > MAX_SVG_BYTES) {
      return { ok: false, reason: `file too large (${stat.size} bytes > ${MAX_SVG_BYTES})` };
    }
    content = readFileSync(svgPath, "utf8");
  } catch (err) {
    return {
      ok: false,
      reason: `cannot read file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Must contain an SVG open tag
  if (!/<svg[\s>]/i.test(content)) {
    return { ok: false, reason: "no <svg> element found" };
  }

  // Must have a viewBox attribute (crucial for scaling)
  if (!/viewBox\s*=/i.test(content)) {
    return { ok: false, reason: "missing viewBox attribute" };
  }

  return { ok: true };
}

/**
 * Sanitize SVG content: strip <script> tags and inline event handlers.
 * Returns the sanitized string.
 */
function sanitizeSvg(content: string): string {
  // Remove <script ...>...</script> blocks (case-insensitive, multiline)
  let result = content.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Remove event handler attributes like onload="..." onclick="..." etc.
  result = result.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");

  // Remove javascript: hrefs
  result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  return result;
}

// ---------------------------------------------------------------------------
// Slug normalization helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a string into a slug-like form for fuzzy matching.
 * Strips punctuation, lowercases, replaces whitespace/separators with a
 * single space. Used to compare svgl titles against our icon titles/aliases.
 */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.\-_]/g, " ") // treat separators as spaces
    .replace(/[^a-z0-9 ]/g, "") // strip everything else
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// svgl data parser
// ---------------------------------------------------------------------------

/**
 * Given a svgl entry, derive candidates for each of our variant keys.
 *
 * svgl conventions observed in the data:
 *   route: string              => a single SVG (no separate light/dark)
 *   route: { light, dark }    => light + dark icon variants
 *   wordmark: string           => single wordmark
 *   wordmark: { light, dark } => wordmarkLight + wordmarkDark
 */
function extractSvglCandidates(entry: SvglEntry): SvglVariantCandidates {
  const candidates: SvglVariantCandidates = {};

  // --- route ---
  if (typeof entry.route === "object") {
    if (entry.route.light) {
      candidates.light = join(SVGL_LIBRARY_DIR, basename(entry.route.light));
    }
    if (entry.route.dark) {
      candidates.dark = join(SVGL_LIBRARY_DIR, basename(entry.route.dark));
    }
  }
  // Single route string: treat as light (the neutral icon)
  // We don't map it to "dark" because a single-coloured icon doesn't imply dark.

  // --- wordmark ---
  if (entry.wordmark !== undefined) {
    if (typeof entry.wordmark === "object") {
      if (entry.wordmark.light) {
        candidates.wordmarkLight = join(
          SVGL_LIBRARY_DIR,
          basename(entry.wordmark.light),
        );
      }
      if (entry.wordmark.dark) {
        candidates.wordmarkDark = join(
          SVGL_LIBRARY_DIR,
          basename(entry.wordmark.dark),
        );
      }
    } else {
      // single wordmark string - no clear light/dark distinction, use as wordmark
      candidates.wordmark = join(SVGL_LIBRARY_DIR, basename(entry.wordmark));
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Parse svgl svgs.ts (TypeScript source) into SvglEntry[]
// ---------------------------------------------------------------------------

/**
 * Naively parse the svgl TypeScript data file to extract title, route, and
 * wordmark values. We use regex-based extraction because importing the TS file
 * directly would require compiling it and resolving its path aliases.
 *
 * The file has a known repeating structure:
 *   {
 *     title: "...",
 *     category: ...,
 *     route: "/library/..." | { light: "/library/...", dark: "/library/..." },
 *     wordmark?: "/library/..." | { light: "/library/...", dark: "/library/..." },
 *     url: "...",
 *   },
 */
function parseSvglData(filePath: string): SvglEntry[] {
  const source = readFileSync(filePath, "utf8");

  const entries: SvglEntry[] = [];

  // Split on object boundaries - look for { ... } blocks within the array
  // Each entry starts at a `{` that follows a comma or the array start.
  // We'll use a character-level parser to properly handle nested braces.

  const arrayStart = source.indexOf("svgs: iSVG[] = [");
  if (arrayStart === -1) {
    throw new Error("Could not find svgs array in svgs.ts");
  }

  const src = source.slice(arrayStart);

  // Walk through characters to extract top-level objects
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let objectStart = -1;
  const objects: string[] = [];

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inString) {
      if (ch === "\\" ) {
        i++; // skip escaped char
        continue;
      }
      if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === "{") {
      if (depth === 1) objectStart = i;
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
      if (depth === 1 && objectStart !== -1) {
        objects.push(src.slice(objectStart, i + 1));
        objectStart = -1;
      }
      continue;
    }
  }

  // Now parse each object string
  for (const obj of objects) {
    const entry = parseEntryObject(obj);
    if (entry) entries.push(entry);
  }

  return entries;
}

/**
 * Parse a single svgl entry object string into an SvglEntry.
 * Returns null if essential fields are missing.
 */
function parseEntryObject(obj: string): SvglEntry | null {
  // Extract title
  const titleMatch = obj.match(/title\s*:\s*["'`]([^"'`]+)["'`]/);
  if (!titleMatch) return null;
  const title = titleMatch[1];

  // Extract url
  const urlMatch = obj.match(/\burl\s*:\s*["'`]([^"'`]+)["'`]/);
  const url = urlMatch ? urlMatch[1] : "";

  // Extract route - could be a string or an object
  const route = extractThemeField(obj, "route");
  if (!route) return null;

  // Extract wordmark (optional)
  const wordmark = extractThemeField(obj, "wordmark");

  return { title, route, wordmark, url };
}

/**
 * Extract a field value that could be either a string or a ThemeOptions object.
 * Field name must be followed by `:`  then either a string literal or `{`.
 */
function extractThemeField(
  obj: string,
  fieldName: string,
): string | SvglThemeOptions | undefined {
  // Match the field name at a word boundary, tolerating whitespace
  // We look for `fieldName:` and then capture what follows
  const fieldRe = new RegExp(
    `\\b${fieldName}\\s*:\\s*`,
  );
  const match = fieldRe.exec(obj);
  if (!match) return undefined;

  const afterField = obj.slice(match.index + match[0].length).trimStart();

  if (afterField.startsWith('"') || afterField.startsWith("'") || afterField.startsWith("`")) {
    // String value
    const quoteChar = afterField[0];
    const end = afterField.indexOf(quoteChar, 1);
    if (end === -1) return undefined;
    return afterField.slice(1, end);
  }

  if (afterField.startsWith("{")) {
    // Object value - parse light/dark
    const closingBrace = findClosingBrace(afterField);
    if (closingBrace === -1) return undefined;
    const objectStr = afterField.slice(0, closingBrace + 1);

    const lightMatch = objectStr.match(/\blight\s*:\s*["'`]([^"'`]+)["'`]/);
    const darkMatch = objectStr.match(/\bdark\s*:\s*["'`]([^"'`]+)["'`]/);

    if (!lightMatch && !darkMatch) return undefined;

    return {
      light: lightMatch ? lightMatch[1] : "",
      dark: darkMatch ? darkMatch[1] : "",
    };
  }

  return undefined;
}

/** Find the index of the closing `}` matching the `{` at position 0 of `s`. */
function findClosingBrace(s: string): number {
  let depth = 0;
  let inStr = false;
  let strChar = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === "\\" ) { i++; continue; }
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = true; strChar = ch; continue; }
    if (ch === "{") { depth++; continue; }
    if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Matching: svgl entry -> our icon
// ---------------------------------------------------------------------------

/**
 * Build a lookup map from normalized title/alias -> our icon index.
 */
function buildOurIconLookup(icons: OurIcon[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    // Index by normalized title
    map.set(normalizeForMatch(icon.title), i);
    // Index by slug (helps catch direct matches)
    map.set(normalizeForMatch(icon.slug.replace(/-/g, " ")), i);
    // Index by aliases
    for (const alias of icon.aliases) {
      const key = normalizeForMatch(alias);
      if (!map.has(key)) map.set(key, i);
    }
  }
  return map;
}

function findOurIconIndex(
  svglEntry: SvglEntry,
  lookup: Map<string, number>,
): number | null {
  const key = normalizeForMatch(svglEntry.title);
  const idx = lookup.get(key);
  return idx !== undefined ? idx : null;
}

// ---------------------------------------------------------------------------
// Variant filename mapping: our key -> target filename
// ---------------------------------------------------------------------------

const VARIANT_FILENAME: Record<EnrichableVariant, string> = {
  light: "light.svg",
  dark: "dark.svg",
  wordmark: "wordmark.svg",
  wordmarkLight: "wordmark-light.svg",
  wordmarkDark: "wordmark-dark.svg",
};

// ---------------------------------------------------------------------------
// Summary tracking
// ---------------------------------------------------------------------------

interface EnrichmentResult {
  slug: string;
  added: EnrichableVariant[];
  skipped: Array<{ variant: EnrichableVariant; reason: string }>;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("enrich-svgl-variants");
  console.log("=".repeat(60));
  console.log(`  Repo root    : ${REPO_ROOT}`);
  console.log(`  svgl root    : ${SVGL_ROOT}`);
  console.log(`  icons.json   : ${ICONS_JSON_PATH}`);
  console.log(`  public/icons : ${PUBLIC_ICONS_DIR}`);
  console.log();

  // --- Validate paths ---
  if (!existsSync(SVGL_ROOT)) {
    console.error(`ERROR: svgl root not found at ${SVGL_ROOT}`);
    console.error("Pass a path with: --svgl-path /path/to/svgl  or SVGL_PATH env var");
    process.exit(1);
  }
  if (!existsSync(SVGL_LIBRARY_DIR)) {
    console.error(`ERROR: svgl library dir not found at ${SVGL_LIBRARY_DIR}`);
    process.exit(1);
  }
  if (!existsSync(SVGL_DATA_FILE)) {
    console.error(`ERROR: svgl data file not found at ${SVGL_DATA_FILE}`);
    process.exit(1);
  }
  if (!existsSync(ICONS_JSON_PATH)) {
    console.error(`ERROR: icons.json not found at ${ICONS_JSON_PATH}`);
    process.exit(1);
  }

  // --- Load our icons ---
  const iconsJsonRaw = readFileSync(ICONS_JSON_PATH, "utf8");
  const ourIcons: OurIcon[] = JSON.parse(iconsJsonRaw) as OurIcon[];
  console.log(`Loaded ${ourIcons.length} icons from icons.json`);

  // --- Parse svgl data ---
  console.log("Parsing svgl data...");
  const svglEntries = parseSvglData(SVGL_DATA_FILE);
  console.log(`Found ${svglEntries.length} svgl entries`);
  console.log();

  // --- Build lookup ---
  const lookup = buildOurIconLookup(ourIcons);

  // --- Process each svgl entry ---
  const results: EnrichmentResult[] = [];
  let matchCount = 0;
  let noMatchCount = 0;

  for (const svglEntry of svglEntries) {
    const iconIdx = findOurIconIndex(svglEntry, lookup);
    if (iconIdx === null) {
      noMatchCount++;
      continue;
    }

    matchCount++;
    const ourIcon = ourIcons[iconIdx];
    const candidates = extractSvglCandidates(svglEntry);
    const result: EnrichmentResult = { slug: ourIcon.slug, added: [], skipped: [] };

    for (const variantKey of ENRICHABLE_VARIANTS) {
      const sourcePath = candidates[variantKey];

      // Skip if we already have this variant
      if (ourIcon.variants[variantKey] !== undefined) {
        continue;
      }

      // Skip if svgl has no candidate for this variant
      if (sourcePath === undefined) {
        continue;
      }

      // Skip if the source file doesn't exist in the svgl library dir
      if (!existsSync(sourcePath)) {
        result.skipped.push({ variant: variantKey, reason: `source not found: ${basename(sourcePath)}` });
        continue;
      }

      // Quality check
      const quality = checkSvgQuality(sourcePath);
      if (!quality.ok) {
        result.skipped.push({ variant: variantKey, reason: quality.reason });
        continue;
      }

      // Sanitize content
      const rawContent = readFileSync(sourcePath, "utf8");
      const sanitized = sanitizeSvg(rawContent);

      // Prepare destination
      const destDir = join(PUBLIC_ICONS_DIR, ourIcon.slug);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      const destFilename = VARIANT_FILENAME[variantKey];
      const destPath = join(destDir, destFilename);

      // Write sanitized content (idempotent - overwrites if identical anyway)
      try {
        writeFileSync(destPath, sanitized, "utf8");
      } catch (err) {
        result.skipped.push({
          variant: variantKey,
          reason: `write failed: ${err instanceof Error ? err.message : String(err)}`,
        });
        continue;
      }

      // Update icons.json entry
      ourIcon.variants[variantKey] = `/icons/${ourIcon.slug}/${destFilename}`;
      result.added.push(variantKey);
    }

    if (result.added.length > 0 || result.skipped.length > 0) {
      results.push(result);
    }
  }

  // --- Write updated icons.json ---
  const enrichedCount = results.filter((r) => r.added.length > 0).length;

  if (enrichedCount > 0) {
    try {
      writeFileSync(ICONS_JSON_PATH, JSON.stringify(ourIcons, null, 2) + "\n", "utf8");
      console.log(`icons.json updated with new variant entries.`);
    } catch (err) {
      console.error(`ERROR: Failed to write icons.json: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  } else {
    console.log("No changes to icons.json (already up to date).");
  }

  // --- Summary ---
  console.log();
  console.log("=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  console.log(`  svgl entries processed : ${svglEntries.length}`);
  console.log(`  Matched to our icons   : ${matchCount}`);
  console.log(`  No match found         : ${noMatchCount}`);
  console.log(`  Icons enriched         : ${enrichedCount}`);

  const totalAdded = results.reduce((n, r) => n + r.added.length, 0);
  const totalSkipped = results.reduce((n, r) => n + r.skipped.length, 0);
  console.log(`  Variants added         : ${totalAdded}`);
  console.log(`  Variants skipped       : ${totalSkipped}`);
  console.log();

  if (enrichedCount > 0) {
    console.log("Enriched icons:");
    for (const r of results) {
      if (r.added.length === 0) continue;
      console.log(`  ${r.slug}`);
      for (const v of r.added) {
        console.log(`    + ${v} -> ${VARIANT_FILENAME[v]}`);
      }
    }
  }

  if (totalSkipped > 0) {
    console.log();
    console.log("Skipped variants:");
    for (const r of results) {
      if (r.skipped.length === 0) continue;
      console.log(`  ${r.slug}`);
      for (const s of r.skipped) {
        console.log(`    - ${s.variant}: ${s.reason}`);
      }
    }
  }

  console.log();
  console.log("Done.");
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
