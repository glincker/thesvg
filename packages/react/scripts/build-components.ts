/**
 * build-components.ts
 *
 * Generates the @thesvg/react distribution from the monorepo source data.
 * For each icon, reads the default SVG and emits a typed React component
 * that forwards refs and accepts all standard SVGProps<SVGSVGElement>.
 *
 * Run with:
 *   bun run scripts/build-components.ts
 *   tsx  scripts/build-components.ts
 *
 * Output layout:
 *   dist/
 *     {slug}.js      ESM component per icon
 *     {slug}.cjs     CJS component per icon
 *     {slug}.d.ts    Type declarations per icon
 *     index.js       ESM barrel (named exports)
 *     index.cjs      CJS barrel (named exports)
 *     index.d.ts     Type barrel
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the packages/react package */
const PKG_ROOT = resolve(__dirname, "..");
/** Root of the thesvg monorepo */
const REPO_ROOT = resolve(PKG_ROOT, "../..");
const ICONS_JSON = join(REPO_ROOT, "src/data/icons.json");
const ICONS_PUBLIC = join(REPO_ROOT, "public/icons");
const DIST = join(PKG_ROOT, "dist");

// ---------------------------------------------------------------------------
// Types mirrored from icons.json shape
// ---------------------------------------------------------------------------

interface RawIconVariants {
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

interface RawIcon {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: RawIconVariants;
  license: string;
  url: string;
  guidelines?: string;
}

// ---------------------------------------------------------------------------
// SVG reading & parsing
// ---------------------------------------------------------------------------

/** Read an SVG file from the public directory. Returns empty string on miss. */
function readSvg(slug: string, variant: string): string {
  const filePath = join(ICONS_PUBLIC, slug, `${variant}.svg`);
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf8").trim();
}

/**
 * Resolve the "primary" SVG for an icon.
 * Preference order: default -> color -> mono -> light -> dark -> wordmark -> first available.
 */
function primarySvg(slug: string, variants: RawIconVariants): string {
  const order = ["default", "color", "mono", "light", "dark", "wordmark"];
  for (const v of order) {
    if (v in variants) {
      const content = readSvg(slug, v);
      if (content) return content;
    }
  }
  for (const v of Object.keys(variants)) {
    const content = readSvg(slug, v);
    if (content) return content;
  }
  return "";
}

// ---------------------------------------------------------------------------
// SVG -> JSX conversion
// ---------------------------------------------------------------------------

/**
 * Extract the viewBox attribute from an SVG string.
 * Returns "0 0 24 24" as a safe fallback.
 */
function extractViewBox(svgContent: string): string {
  const match = svgContent.match(/viewBox=["']([^"']+)["']/);
  return match ? match[1] : "0 0 24 24";
}

/**
 * Convert kebab-case attribute names to camelCase.
 * e.g. stroke-width -> strokeWidth, fill-rule -> fillRule
 */
function kebabToCamel(attr: string): string {
  return attr.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

/**
 * Convert a CSS style string like "mask-type:alpha;display:inline"
 * into a JSX style object expression like `{{ maskType: "alpha", display: "inline" }}`.
 */
function convertStyleStringToJsx(styleStr: string): string {
  // Strip surrounding quotes if present
  const raw = styleStr.replace(/^["']|["']$/g, "");
  const declarations = raw
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d.length > 0);

  const entries = declarations.map((decl) => {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) return null;
    const prop = decl.slice(0, colonIdx).trim();
    const val = decl.slice(colonIdx + 1).trim();
    const camelProp = kebabToCamel(prop);
    return `${camelProp}: "${val}"`;
  }).filter(Boolean);

  return `{{ ${entries.join(", ")} }}`;
}

/**
 * Convert SVG attributes to JSX-safe equivalents.
 * - class -> className
 * - style="..." -> style={{ ... }} (object form for React)
 * - kebab-case -> camelCase
 * - Removes xmlns (React adds it automatically)
 * - Converts xlink:href -> href (xlink is deprecated)
 */
function convertAttrToJsx(attr: string, value: string): string | null {
  // Drop xmlns declarations — React handles them
  if (attr === "xmlns" || attr === "xmlns:xlink") return null;
  // class -> className
  if (attr === "class") return `className=${value}`;
  // xlink:href -> href
  if (attr === "xlink:href") return `href=${value}`;
  // style="..." -> style={{ ... }} (React requires object, not string)
  if (attr === "style") {
    return `style=${convertStyleStringToJsx(value)}`;
  }
  // Convert kebab-case to camelCase
  const camel = kebabToCamel(attr);
  return `${camel}=${value}`;
}

/**
 * Parse an SVG string and return JSX-safe inner content (everything between
 * the opening <svg ...> and closing </svg> tags), plus any extra props that
 * should be spread onto the outer <svg> element (viewBox).
 *
 * We intentionally do NOT use a full DOM parser to keep zero runtime deps.
 * The conversion is done with targeted regex replacements that are sufficient
 * for well-formed SVG files produced by design tools / icon libraries.
 */
function svgToJsxInner(svgContent: string): { inner: string; viewBox: string } {
  const viewBox = extractViewBox(svgContent);

  // Strip outer <svg ...> wrapper tags
  let inner = svgContent
    // Remove the opening <svg ...> tag (single-line or multi-line)
    .replace(/^<svg[^>]*>/s, "")
    // Remove the closing </svg> tag
    .replace(/<\/svg>\s*$/, "")
    .trim();

  // Convert attribute names throughout the inner content
  // Match attribute="value" or attribute='value' patterns
  inner = inner.replace(
    /\b([a-zA-Z][a-zA-Z0-9:_-]*)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    (_, attr: string, value: string) => {
      const converted = convertAttrToJsx(attr, value);
      return converted ?? "";
    },
  );

  // Remove any standalone xmlns:xlink attributes that may have no value pairing
  inner = inner.replace(/\s+xmlns:[a-z]+/g, "");

  return { inner, viewBox };
}

// ---------------------------------------------------------------------------
// PascalCase / identifier helpers
// ---------------------------------------------------------------------------

/**
 * Convert a slug to a PascalCase component name.
 * - Hyphens and dots are treated as word separators
 * - Each segment is title-cased
 * - If the result starts with a digit, prefix with "I" (e.g. 01dotai -> I01Dotai)
 *
 * Examples:
 *   github            -> Github
 *   visual-studio-code -> VisualStudioCode
 *   01dotai           -> I01Dotai
 *   .env              -> DotEnv  (slug is "dotenv" per icons.json)
 */
function toPascalCase(slug: string): string {
  const pascal = slug
    .split(/[-._]+/)
    .map((segment) => {
      if (segment.length === 0) return "";
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join("");

  // Prefix numeric-leading names with "I" to produce a valid identifier
  if (/^[0-9]/.test(pascal)) return `I${pascal}`;
  return pascal;
}

/**
 * Turn a slug into a valid JS export identifier for the barrel.
 * Unlike toPascalCase (which is used for the component class name),
 * this preserves numeric prefixes with "i_" for backward compat with
 * the @thesvg/icons pattern used in build-icons.ts.
 */
function toSafeIdentifier(slug: string): string {
  let id = slug.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(id)) id = `i_${id}`;
  return id;
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateEsmComponent(icon: RawIcon): string {
  const svgContent = primarySvg(icon.slug, icon.variants);
  const componentName = toPascalCase(icon.slug);

  if (!svgContent) {
    // Emit a minimal placeholder if the SVG file is missing
    return [
      `// @thesvg/react — ${icon.title}`,
      `// Auto-generated. Do not edit.`,
      `// WARNING: SVG source not found for slug "${icon.slug}"`,
      ``,
      `import { forwardRef } from 'react';`,
      ``,
      `const ${componentName} = forwardRef(`,
      `  function ${componentName}(props, ref) {`,
      `    return null;`,
      `  }`,
      `);`,
      `${componentName}.displayName = '${componentName}';`,
      ``,
      `export default ${componentName};`,
    ].join("\n");
  }

  const { inner, viewBox } = svgToJsxInner(svgContent);

  // Indent the inner SVG content for readability
  const indentedInner = inner
    .split("\n")
    .map((line) => (line.trim() ? `      ${line}` : ""))
    .join("\n");

  return [
    `// @thesvg/react — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import { forwardRef } from 'react';`,
    ``,
    `const ${componentName} = forwardRef(`,
    `  function ${componentName}({ viewBox = '${viewBox}', ...props }, ref) {`,
    `    return (`,
    `      <svg`,
    `        ref={ref}`,
    `        viewBox={viewBox}`,
    `        fill="none"`,
    `        xmlns="http://www.w3.org/2000/svg"`,
    `        {...props}`,
    `      >`,
    indentedInner,
    `      </svg>`,
    `    );`,
    `  }`,
    `);`,
    `${componentName}.displayName = '${componentName}';`,
    ``,
    `export default ${componentName};`,
  ].join("\n");
}

function generateCjsComponent(icon: RawIcon): string {
  const svgContent = primarySvg(icon.slug, icon.variants);
  const componentName = toPascalCase(icon.slug);

  if (!svgContent) {
    return [
      `"use strict";`,
      `// @thesvg/react — ${icon.title}`,
      `// Auto-generated. Do not edit.`,
      `// WARNING: SVG source not found for slug "${icon.slug}"`,
      ``,
      `Object.defineProperty(exports, "__esModule", { value: true });`,
      ``,
      `const react_1 = require("react");`,
      ``,
      `const ${componentName} = react_1.forwardRef(function ${componentName}(_props, _ref) {`,
      `  return null;`,
      `});`,
      `${componentName}.displayName = '${componentName}';`,
      ``,
      `exports.default = ${componentName};`,
    ].join("\n");
  }

  const { inner, viewBox } = svgToJsxInner(svgContent);

  // For CJS we emit pre-compiled JSX using React.createElement calls.
  // This avoids requiring a JSX transform in the CJS output.
  const innerJsxToCjs = convertJsxToCjs(inner);

  return [
    `"use strict";`,
    `// @thesvg/react — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
    `const react_1 = require("react");`,
    ``,
    `const ${componentName} = react_1.forwardRef(function ${componentName}({ viewBox = '${viewBox}', ...props }, ref) {`,
    `  return react_1.createElement(`,
    `    'svg',`,
    `    Object.assign({ ref, viewBox, fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, props),`,
    `    ...${JSON.stringify(innerJsxToCjs, null, 2)}`,
    `      .map(function(el) {`,
    `        if (typeof el === 'string') return el;`,
    `        return react_1.createElement(el.type, el.props, ...(el.children || []));`,
    `      })`,
    `  );`,
    `});`,
    `${componentName}.displayName = '${componentName}';`,
    ``,
    `exports.default = ${componentName};`,
  ].join("\n");
}

/**
 * Very lightweight JSX->createElement-descriptor converter for CJS output.
 *
 * Returns a plain-object tree that can be JSON-serialised and then
 * reconstructed with React.createElement at runtime.
 *
 * Supports the subset of SVG elements produced by typical icon exports:
 * self-closing tags and simple nesting (no mixed text+element content).
 */
interface CjsNode {
  type: string;
  props: Record<string, string | Record<string, string>>;
  children: CjsNode[];
}

function convertJsxToCjs(jsxInner: string): CjsNode[] {
  const nodes: CjsNode[] = [];
  // Regex for a self-closing tag or an open tag — handles multi-line via [^]
  const tagRe = /<([a-zA-Z][a-zA-Z0-9:.-]*)([^>]*?)(\/?)>/g;
  const closeRe = /<\/([a-zA-Z][a-zA-Z0-9:.-]*)>/;

  const stack: CjsNode[] = [];
  let remaining = jsxInner;

  while (remaining.length > 0) {
    const tagMatch = tagRe.exec(remaining);
    if (!tagMatch) break;

    const tagName = tagMatch[1];
    const attrsRaw = tagMatch[2].trim();
    const isSelfClosing = tagMatch[3] === "/";
    const matchStart = tagMatch.index;
    const matchEnd = tagMatch.index + tagMatch[0].length;

    // Parse attributes from the raw attr string
    const props: Record<string, string | Record<string, string>> = {};
    const attrRe = /([a-zA-Z][a-zA-Z0-9:_-]*)=["']([^"']*)["']/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRe.exec(attrsRaw)) !== null) {
      const attrName = attrMatch[1];
      const attrVal = attrMatch[2];
      if (attrName === "style") {
        // Convert CSS style string to object for React createElement
        const styleObj: Record<string, string> = {};
        attrVal.split(";").filter((d) => d.trim()).forEach((decl) => {
          const colonIdx = decl.indexOf(":");
          if (colonIdx === -1) return;
          const cssProp = decl.slice(0, colonIdx).trim();
          const cssVal = decl.slice(colonIdx + 1).trim();
          styleObj[kebabToCamel(cssProp)] = cssVal;
        });
        props[attrName] = styleObj;
      } else {
        props[attrName] = attrVal;
      }
    }

    const node: CjsNode = { type: tagName, props, children: [] };

    if (isSelfClosing) {
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      } else {
        nodes.push(node);
      }
    } else {
      // Find the matching close tag
      const closeSearchStr = remaining.slice(matchEnd);
      const closeMatch = closeRe.exec(closeSearchStr);
      if (closeMatch) {
        const innerContent = closeSearchStr.slice(0, closeMatch.index);
        node.children = convertJsxToCjs(innerContent);
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        } else {
          nodes.push(node);
        }
        remaining = closeSearchStr.slice(closeMatch.index + closeMatch[0].length);
        tagRe.lastIndex = 0;
        continue;
      } else {
        stack.push(node);
      }
    }

    remaining = remaining.slice(matchEnd);
    tagRe.lastIndex = 0;
  }

  // Flush anything remaining on the stack
  for (const s of stack) {
    nodes.push(s);
  }

  return nodes;
}

function generateDtsComponent(icon: RawIcon): string {
  const componentName = toPascalCase(icon.slug);
  return [
    `// @thesvg/react — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';`,
    ``,
    `export type SvgIconProps = SVGProps<SVGSVGElement>;`,
    ``,
    `declare const ${componentName}: ForwardRefExoticComponent<SvgIconProps & RefAttributes<SVGSVGElement>>;`,
    `export default ${componentName};`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Barrel generators
// ---------------------------------------------------------------------------

function generateEsmBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `// @thesvg/react`,
    `// Auto-generated barrel. Do not edit.`,
    ``,
  ];
  for (const { slug, componentName } of entries) {
    lines.push(`export { default as ${componentName} } from './${slug}.js';`);
  }
  return lines.join("\n");
}

function generateCjsBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `"use strict";`,
    `// @thesvg/react`,
    `// Auto-generated barrel. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
  ];
  for (const { slug, componentName } of entries) {
    lines.push(
      `const _${toSafeIdentifier(slug)} = require('./${slug}.cjs');`,
      `exports.${componentName} = _${toSafeIdentifier(slug)}.default;`,
    );
  }
  return lines.join("\n");
}

function generateDtsBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `// @thesvg/react`,
    `// Auto-generated type barrel. Do not edit.`,
    ``,
    `export type { SvgIconProps } from './types.js';`,
    ``,
  ];
  for (const { componentName, slug } of entries) {
    lines.push(`export { default as ${componentName} } from './${slug}.js';`);
  }
  return lines.join("\n");
}

function generateTypesDeclaration(): string {
  return [
    `// @thesvg/react — shared types`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from 'react';`,
    ``,
    `export type SvgIconProps = SVGProps<SVGSVGElement>;`,
    ``,
    `export type SvgIconComponent = ForwardRefExoticComponent<`,
    `  SvgIconProps & RefAttributes<SVGSVGElement>`,
    `>;`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Build validation
// ---------------------------------------------------------------------------

function validateOutput(): boolean {
  console.log("\nValidating output...");
  const files = readdirSync(DIST).filter((f) => f.endsWith(".js"));
  let errors = 0;

  // Sample up to 20 files plus always check index.js
  const sampled = new Set<string>(["index.js", "types.js"]);
  const candidates = files.filter((f) => f !== "index.js" && f !== "types.js");
  const step = Math.max(1, Math.floor(candidates.length / 18));
  for (let i = 0; i < candidates.length && sampled.size < 20; i += step) {
    sampled.add(candidates[i]);
  }

  for (const file of sampled) {
    const content = readFileSync(join(DIST, file), "utf8");

    // Check for TypeScript-only syntax in .js files
    if (/\bimport\s+type\b/.test(content)) {
      console.error(`  FAIL: ${file} contains "import type"`);
      errors++;
    }
    if (/\bexport\s+type\s*\{/.test(content)) {
      console.error(`  FAIL: ${file} contains "export type {}"`);
      errors++;
    }
    if (/forwardRef</.test(content)) {
      console.error(`  FAIL: ${file} contains generic type params on forwardRef`);
      errors++;
    }

    // Check for string-form style attributes (style="...") in JSX
    // Skip types.js which has no components
    if (file !== "types.js" && file !== "index.js" && /style="[^"]*"/.test(content)) {
      console.error(`  FAIL: ${file} contains style="..." string attribute`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log(`  PASS: Validated ${sampled.size} files, no issues found.`);
    return true;
  }
  console.error(`  ${errors} validation error(s) found.`);
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Reading icons.json…");
  const rawIcons: RawIcon[] = JSON.parse(readFileSync(ICONS_JSON, "utf8")) as RawIcon[];
  console.log(`Found ${rawIcons.length} icons.`);

  mkdirSync(DIST, { recursive: true });

  const entries: Array<{ slug: string; componentName: string }> = [];
  let skipped = 0;

  for (const icon of rawIcons) {
    const componentName = toPascalCase(icon.slug);

    // Write ESM component (JSX — requires a JSX transform / bundler or tsc)
    writeFileSync(join(DIST, `${icon.slug}.js`), generateEsmComponent(icon) + "\n");
    // Write CJS component (pre-compiled to createElement calls)
    writeFileSync(join(DIST, `${icon.slug}.cjs`), generateCjsComponent(icon) + "\n");
    // Write type declarations
    writeFileSync(join(DIST, `${icon.slug}.d.ts`), generateDtsComponent(icon) + "\n");

    const svgExists = Boolean(primarySvg(icon.slug, icon.variants));
    if (!svgExists) skipped++;

    entries.push({ slug: icon.slug, componentName });

    if (entries.length % 500 === 0) {
      console.log(`  Processed ${entries.length} / ${rawIcons.length}…`);
    }
  }

  // Shared types
  writeFileSync(join(DIST, "types.d.ts"), generateTypesDeclaration() + "\n");
  writeFileSync(
    join(DIST, "types.js"),
    `// @thesvg/react — shared types (runtime stub, types are declaration-only)\nexport {};\n`,
  );
  writeFileSync(
    join(DIST, "types.cjs"),
    `"use strict";\n// @thesvg/react — shared types (runtime stub)\nObject.defineProperty(exports, "__esModule", { value: true });\n`,
  );

  // Barrel files
  writeFileSync(join(DIST, "index.js"), generateEsmBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.cjs"), generateCjsBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.d.ts"), generateDtsBarrel(entries) + "\n");

  console.log(`\nDone. Built ${entries.length} components (${skipped} had no SVG source).`);
  if (skipped > 0) {
    console.log(`  ${skipped} icons emitted null placeholder components - check SVG paths.`);
  }
  console.log(`Output: ${DIST}`);

  // Validate output
  const valid = validateOutput();
  if (!valid) {
    process.exit(1);
  }
}

main();
