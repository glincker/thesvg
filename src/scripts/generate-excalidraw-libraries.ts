/**
 * Generates category-based Excalidraw shape libraries (.excalidrawlib) from
 * the brand icon catalog, so users can drop them into Excalidraw's library
 * panel for architecture and product diagrams. Mirrors the draw.io shape
 * library generator's structure and category scope.
 *
 * Run: npx tsx src/scripts/generate-excalidraw-libraries.ts
 *
 * Each icon's `default` SVG variant is decomposed into native Excalidraw
 * vector elements (filled polygons) rather than embedded as an image: the
 * `.excalidrawlib` format has no top-level `files` map, and Excalidraw
 * explicitly disallows adding "image" elements to a library
 * (`LIBRARY_DISABLED_TYPES` in excalidraw/excalidraw). See
 * src/lib/svg-to-excalidraw.ts for the conversion and its known
 * limitations (curve flattening, no hole/even-odd support, gradients
 * approximated with the icon's brand hex).
 *
 * Outputs:
 *   public/integrations/excalidraw/{slug}.excalidrawlib - one file per
 *   category in EXCALIDRAW_LIBRARIES
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

import { getAllIcons, type IconEntry } from "../lib/icons";
import {
  EXCALIDRAW_LIBRARIES,
  getIconsForExcalidrawLibrary,
  type ExcalidrawLibraryCategory,
} from "../lib/excalidraw-libraries";
import {
  generateExcalidrawId,
  polygonsToElements,
  type ExcalidrawLibraryFile,
  type ExcalidrawLibraryItem,
} from "../lib/svg-to-excalidraw";
import { svgToPolygons } from "../lib/svg-path-to-polygons";

const ROOT = join(__dirname, "../..");
const PUBLIC_DIR = join(ROOT, "public");
const OUT_DIR = join(PUBLIC_DIR, "integrations/excalidraw");

/** Target rendered height (px) for each icon; width scales to preserve
 * the source viewBox's aspect ratio. */
const TARGET_HEIGHT = 80;
/** Simple grid layout so icons don't all stack at the origin. */
const GRID_COLUMNS = 6;
const CELL_PITCH = 100;

function buildLibraryItem(icon: IconEntry, gridIndex: number): ExcalidrawLibraryItem | null {
  const svgPath = icon.variants.default;
  if (!svgPath) return null;

  const filePath = join(PUBLIC_DIR, svgPath.replace(/^\//, ""));
  if (!existsSync(filePath)) return null;

  const svgContent = readFileSync(filePath, "utf-8");
  const fallbackFill = icon.hex.startsWith("#") ? icon.hex : `#${icon.hex}`;
  const { shapes, viewBox } = svgToPolygons(svgContent, fallbackFill);
  if (!shapes.length) return null;

  const vbHeight = viewBox.height || 24;
  const scale = TARGET_HEIGHT / vbHeight;

  const col = gridIndex % GRID_COLUMNS;
  const row = Math.floor(gridIndex / GRID_COLUMNS);
  const offsetX = col * CELL_PITCH;
  const offsetY = row * CELL_PITCH;

  const groupId = generateExcalidrawId();
  const elements = polygonsToElements(shapes, viewBox, scale, offsetX, offsetY, groupId);
  if (!elements.length) return null;

  return {
    id: generateExcalidrawId(),
    status: "unpublished",
    elements,
    created: Date.now(),
    name: icon.title,
  };
}

function generateCategory(lib: ExcalidrawLibraryCategory, allIcons: IconEntry[]): void {
  const icons = getIconsForExcalidrawLibrary(allIcons, lib);
  const libraryItems: ExcalidrawLibraryItem[] = [];
  let skipped = 0;

  for (const icon of icons) {
    try {
      const item = buildLibraryItem(icon, libraryItems.length);
      if (item) {
        libraryItems.push(item);
      } else {
        skipped++;
      }
    } catch (error) {
      skipped++;
      console.warn(
        `  [${lib.slug}] skipped "${icon.slug}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const file: ExcalidrawLibraryFile = {
    type: "excalidrawlib",
    version: 2,
    source: "https://thesvg.org",
    libraryItems,
  };

  const json = JSON.stringify(file);
  writeFileSync(join(OUT_DIR, `${lib.slug}.excalidrawlib`), json);

  const elementCount = libraryItems.reduce((sum, item) => sum + item.elements.length, 0);
  const sizeKb = (Buffer.byteLength(json) / 1024).toFixed(1);
  console.log(
    `  ${lib.slug}.excalidrawlib: ${libraryItems.length} icons, ${elementCount} elements, ${sizeKb} KB` +
      (skipped ? ` (${skipped} skipped)` : ""),
  );
}

function main(): void {
  if (existsSync(OUT_DIR)) {
    rmSync(OUT_DIR, { recursive: true });
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const allIcons = getAllIcons();
  console.log(`Generating Excalidraw libraries from ${allIcons.length} icons...`);
  for (const lib of EXCALIDRAW_LIBRARIES) {
    generateCategory(lib, allIcons);
  }
  console.log("Excalidraw library generation complete.");
}

main();
