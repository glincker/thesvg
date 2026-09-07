/**
 * Generates draw.io / diagrams.net custom shape library XML files in
 * public/integrations/drawio/, one per curated category defined in
 * src/lib/drawio-libraries.ts.
 *
 * Run: npx tsx src/scripts/generate-drawio-libraries.ts
 *
 * Outputs:
 *   public/integrations/drawio/{slug}.xml - one draw.io shape library per
 *   entry in DRAWIO_LIBRARIES, each wrapping a JSON array of shape defs in
 *   an <mxlibrary> tag (the format draw.io's "Edit Diagram > Edit Library"
 *   / custom library import expects).
 *
 * Each shape's `xml` field embeds the icon's default-variant SVG as a
 * base64 data URI inside an mxCell image shape. Base64 output never
 * contains characters that need XML or JSON escaping (its alphabet is
 * limited to A-Z, a-z, 0-9, +, /, =), so the only escaping JSON.stringify
 * has to do is around the surrounding XML's literal double quotes - which
 * it handles automatically. That keeps the two encodings (XML attribute
 * values nested inside a JSON string) from colliding.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join, resolve, sep } from "path";
import { DRAWIO_LIBRARIES, getIconsForDrawioLibrary } from "@/lib/drawio-libraries";
import type { IconEntry } from "@/lib/icons";

const ROOT = join(__dirname, "../..");
const ICONS_JSON = join(ROOT, "src/data/icons.json");
const PUBLIC_DIR = join(ROOT, "public");
const ICONS_DIR = resolve(PUBLIC_DIR, "icons") + sep;
const OUTPUT_DIR = join(ROOT, "public/integrations/drawio");
const COUNTS_PATH = join(ROOT, "src/data/drawio-library-counts.json");

interface DrawioShapeEntry {
  xml: string;
  w: number;
  h: number;
  title: string;
  aspect: "fixed";
}

/** Extracts width/height from an SVG's viewBox attribute; falls back to 1:1. */
function getAspectDims(svg: string): { w: number; h: number } {
  const match = svg.match(/viewBox=["']([^"']+)["']/);
  const FALLBACK = { w: 48, h: 48 };
  if (!match) return FALLBACK;

  const parts = match[1].trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return FALLBACK;

  const [, , vbWidth, vbHeight] = parts;
  if (!vbWidth || !vbHeight) return FALLBACK;

  const h = 48;
  const w = Math.round(48 * (vbWidth / vbHeight));
  return { w, h };
}

function buildShapeEntry(icon: IconEntry): DrawioShapeEntry | null {
  const svgPath = icon.variants.default;
  if (!svgPath) return null;

  const absPath = resolve(PUBLIC_DIR, `.${svgPath}`);
  if (!absPath.startsWith(ICONS_DIR)) {
    throw new Error(`variant path "${svgPath}" resolves outside public/icons/, refusing to read`);
  }
  const svg = readFileSync(absPath, "utf-8");

  const { w, h } = getAspectDims(svg);
  const base64 = Buffer.from(svg, "utf-8").toString("base64");

  const xml = `<mxGraphModel><root><mxCell style="shape=image;html=1;image=data:image/svg+xml;base64,${base64};" vertex="1"><mxGeometry width="${w}" height="${h}" as="geometry"/></mxCell></root></mxGraphModel>`;

  return { xml, w, h, title: icon.title, aspect: "fixed" };
}

function main() {
  const icons: IconEntry[] = JSON.parse(readFileSync(ICONS_JSON, "utf-8"));

  // Clean previous output and ensure directory
  if (existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true });
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalSkipped = 0;
  const counts: Record<string, number> = {};

  for (const lib of DRAWIO_LIBRARIES) {
    const matched = getIconsForDrawioLibrary(icons, lib);
    const entries: DrawioShapeEntry[] = [];
    let skipped = 0;

    for (const icon of matched) {
      try {
        const entry = buildShapeEntry(icon);
        if (!entry) {
          skipped++;
          continue;
        }
        // Round-trip through JSON.stringify per-entry to guarantee the icon's
        // title/slug can't produce a malformed library file (e.g. unpaired
        // surrogate code points).
        JSON.stringify(entry);
        entries.push(entry);
      } catch (error) {
        console.error(`[generate-drawio-libraries] Failed to process icon "${icon.slug}" for library "${lib.slug}":`, error);
        skipped++;
      }
    }

    const outputPath = join(OUTPUT_DIR, `${lib.slug}.xml`);
    const contents = `<mxlibrary>${JSON.stringify(entries)}</mxlibrary>`;
    writeFileSync(outputPath, contents, "utf-8");

    const sizeKb = (Buffer.byteLength(contents, "utf-8") / 1024).toFixed(1);
    console.log(`  ${lib.label} (${lib.slug}.xml): ${entries.length} icons, ${sizeKb} KB${skipped ? `, ${skipped} skipped` : ""}`);

    counts[lib.slug] = entries.length;
    totalSkipped += skipped;
  }

  // Committed (not gitignored) so the page can show the actual generated
  // count without re-running this script, and so the count can never
  // silently diverge from what a downloaded library file really contains
  // if a future icon fails conversion.
  writeFileSync(COUNTS_PATH, JSON.stringify(counts, null, 2) + "\n", "utf-8");

  console.log(`draw.io library generation complete.${totalSkipped ? ` ${totalSkipped} icons skipped total.` : ""}`);
}

main();
