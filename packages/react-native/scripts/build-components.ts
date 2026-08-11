/**
 * build-components.ts
 *
 * Generates the @thesvg/react-native distribution from the monorepo source
 * data. Unlike @thesvg/react (one self-contained inline-JSX component per
 * icon), this package mirrors the lucide-react-native architecture:
 *
 *   - Each icon compiles down to lightweight *data*: a tree of
 *     [tagName, props, children] tuples extracted from its SVG.
 *   - A single shared runtime component (`createIcon`, emitted once as
 *     dist/createIcon.{js,cjs,d.ts}) recursively resolves each tuple's tag
 *     name against react-native-svg's exports and renders it.
 *
 * This keeps per-icon modules tiny (data only, no repeated render logic),
 * which matters at 6,500+ icons — the React DOM package's one-component-per-
 * file approach doesn't scale to React Native's bundle/startup constraints.
 *
 * Run with:
 *   bun run scripts/build-components.ts
 *   tsx  scripts/build-components.ts
 *
 * Output layout:
 *   dist/
 *     createIcon.js    ESM shared runtime (renders icon data via react-native-svg)
 *     createIcon.cjs    CJS shared runtime
 *     createIcon.d.ts   Shared runtime + data types
 *     icons/
 *       {slug}.js       ESM icon data module per icon
 *       {slug}.cjs      CJS icon data module per icon
 *       {slug}.d.ts     Type declarations per icon
 *     index.js          ESM barrel (named exports)
 *     index.cjs         CJS barrel (named exports)
 *     index.d.ts        Type barrel
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the packages/react-native package */
const PKG_ROOT = resolve(__dirname, "..");
/** Root of the thesvg monorepo */
const REPO_ROOT = resolve(PKG_ROOT, "../..");
const ICONS_JSON = join(REPO_ROOT, "src/data/icons.json");
const DIST = join(PKG_ROOT, "dist");
const DIST_ICONS = join(DIST, "icons");

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
// SVG reading
// ---------------------------------------------------------------------------

/**
 * Read an SVG file given its icons.json-relative public path (e.g.
 * "/icons/apple-music/wordmark-light.svg"). Returns empty string on miss.
 *
 * Variant SVG filenames aren't always the camelCase variant key
 * (e.g. "wordmarkLight" -> "wordmark-light.svg" on disk), so the path must
 * come from icons.json rather than being reconstructed from slug + variant.
 */
function readSvg(publicPath: string): string {
  const filePath = join(REPO_ROOT, "public", publicPath.replace(/^\//, ""));
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf8").trim();
}

/**
 * Resolve the "primary" SVG for an icon.
 * Preference order: default -> color -> mono -> light -> dark -> wordmark -> first available.
 */
function primarySvg(variants: RawIconVariants): string {
  const order = ["default", "color", "mono", "light", "dark", "wordmark"];
  for (const v of order) {
    const path = variants[v];
    if (path) {
      const content = readSvg(path);
      if (content) return content;
    }
  }
  for (const path of Object.values(variants)) {
    if (!path) continue;
    const content = readSvg(path);
    if (content) return content;
  }
  return "";
}

// ---------------------------------------------------------------------------
// SVG -> render-tree conversion
// ---------------------------------------------------------------------------

/** Extract the viewBox attribute from an SVG string. Falls back to "0 0 24 24". */
function extractViewBox(svgContent: string): string {
  const match = svgContent.match(/viewBox=["']([^"']+)["']/);
  return match ? match[1] : "0 0 24 24";
}

interface RootSvgPaint {
  fill: string;
  stroke?: string;
}

/**
 * Extract root paint attributes from the outer <svg> element. Same rules as
 * @thesvg/react's extractRootSvgPaint (kept identical so the two packages
 * render the same default color for the same source SVG):
 * - Explicit fill (including "none") is preserved as-is.
 * - No fill + has stroke: "none" (stroke-only icons; fill must not bleed).
 * - No fill + no stroke: "currentColor" so paths inherit the icon's `color` prop.
 */
function extractRootSvgPaint(svgContent: string): RootSvgPaint {
  const svgTag = svgContent.match(/<svg[^>]*>/s);
  if (!svgTag) return { fill: "currentColor" };

  const fillMatch = svgTag[0].match(/\bfill=["']([^"']+)["']/);
  const strokeMatch = svgTag[0].match(/\bstroke=["']([^"']+)["']/);

  return {
    fill: fillMatch ? fillMatch[1] : (strokeMatch ? "none" : "currentColor"),
    stroke: strokeMatch ? strokeMatch[1] : undefined,
  };
}

/**
 * Strip the outer <svg ...>...</svg> wrapper and any XML/HTML constructs that
 * have no react-native-svg equivalent, returning just the inner markup plus
 * the extracted viewBox/paint.
 *
 * Beyond what @thesvg/react strips, this also removes <title>, <desc>,
 * <script>, and <filter> blocks: react-native-svg has no CSS engine (so
 * <style> and class-based styling never applied here either) and no filter
 * primitives, so shipping them would just be dead weight / dangling
 * `filter="url(#id)"` references to nothing.
 */
function stripToInner(svgContent: string): { inner: string; viewBox: string; fill: string; stroke?: string } {
  const viewBox = extractViewBox(svgContent);
  const { fill, stroke } = extractRootSvgPaint(svgContent);

  let inner = svgContent
    .replace(/^<svg[^>]*>/s, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();

  inner = inner.replace(/<\?xml[^?]*\?>/g, ""); // XML prologs
  inner = inner.replace(/<!DOCTYPE[^>]*>/gi, ""); // DOCTYPE declarations
  inner = inner.replace(/<!--[\s\S]*?-->/g, ""); // HTML/XML comments
  inner = inner.replace(/<sodipodi:[^>]*(?:\/>|>[\s\S]*?<\/sodipodi:[^>]+>)/g, "");
  // Self-closing forms (<metadata/>, <style/>) first, so the block-form regexes
  // below don't need to worry about matching across an unrelated self-closed tag.
  inner = inner.replace(/<(metadata|style|title|desc|filter)[^>]*\/>/gi, "");
  inner = inner.replace(/<metadata[\s\S]*?<\/metadata>/g, "");
  inner = inner.replace(/<style[\s\S]*?<\/style>/g, ""); // no CSS engine in react-native-svg
  inner = inner.replace(/<title[\s\S]*?<\/title>/gi, ""); // no visual/DOM equivalent
  inner = inner.replace(/<desc[\s\S]*?<\/desc>/gi, "");
  inner = inner.replace(/<script[\s\S]*?<\/script>/gi, "");
  inner = inner.replace(/<filter[\s\S]*?<\/filter>/gi, ""); // no filter primitive support
  inner = inner.replace(/<(rdf|dc|cc):[^>]*(?:\/>|>[\s\S]*?<\/\1:[^>]+>)/g, "");

  // Unwrap nested <svg> wrappers from Inkscape exports (keep their children)
  inner = inner.replace(/<svg[^>]*>/gs, "");
  inner = inner.replace(/<\/svg>/g, "");

  return { inner, viewBox, fill, stroke };
}

/** Convert kebab-case attribute names to camelCase (stroke-width -> strokeWidth). */
function kebabToCamel(attr: string): string {
  return attr.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

/**
 * Parse a CSS declaration string ("fill:#fff;stroke-width:2") into an object
 * of camelCased presentation-attribute props. react-native-svg components
 * take these as direct props (fill=, strokeWidth=), not a nested style
 * object the way DOM SVG can, so — unlike @thesvg/react, which converts
 * style="..." into a React style object — this merges the declarations
 * directly onto the element's props, matching inline style's normal
 * override-everything-else precedence in the CSS cascade.
 */
function parseStyleToProps(styleValue: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const decl of styleValue.split(";")) {
    const trimmed = decl.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const cssProp = trimmed.slice(0, colonIdx).trim();
    const cssVal = trimmed.slice(colonIdx + 1).trim();
    if (!cssProp || !cssVal) continue;
    props[kebabToCamel(cssProp)] = cssVal;
  }
  return props;
}

/**
 * Convert one SVG attribute to its react-native-svg prop equivalent.
 * Returns null when the attribute should be dropped entirely.
 *
 * Reuses the same drop-list / rename rules as @thesvg/react's
 * convertAttrToJsx (xmlns/inkscape/sodipodi/xml:/dc:/cc:/rdf: dropped,
 * xlink:href -> href, data- and aria- prefixed attrs kept hyphenated,
 * kebab-case -> camelCase)
 * with two react-native-svg-specific additions: `class`/`className` has no
 * meaning without a CSS engine so it's dropped, and `filter` is dropped
 * since <filter> definitions never survive stripToInner().
 */
function convertAttrForRN(attr: string, value: string): [string, string] | null {
  if (attr === "xmlns" || attr.startsWith("xmlns:")) return null;
  if (attr.startsWith("inkscape:") || attr.startsWith("sodipodi:")) return null;
  if (attr.startsWith("xml:")) return null;
  if (attr.startsWith("dc:") || attr.startsWith("cc:") || attr.startsWith("rdf:")) return null;
  if (attr === "class" || attr === "className") return null; // no CSS classes in react-native-svg
  if (attr === "filter") return null; // <filter> defs are stripped; drop dangling refs too
  if (attr === "xlink:href") return ["href", value];
  if (attr.startsWith("data-") || attr.startsWith("aria-")) return [attr, value];
  return [kebabToCamel(attr), value];
}

/**
 * One parsed attribute string ("id" "d" ...) into a props record, style-aware.
 *
 * The value-matching group intentionally accepts a full quoted string rather
 * than "everything up to the next quote character" — attribute values that
 * embed the opposite quote style (e.g. a double-quoted font-family listing a
 * single-quoted font name, font-family="...,'Inter',...") would otherwise
 * get truncated at that inner quote.
 */
function attrsToProps(attrsRaw: string): Record<string, string> {
  const props: Record<string, string> = {};
  let styleProps: Record<string, string> = {};
  const attrRe = /([a-zA-Z][a-zA-Z0-9:_-]*)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(attrsRaw)) !== null) {
    const name = match[1];
    const value = match[2].slice(1, -1);
    if (name === "style") {
      styleProps = parseStyleToProps(value);
      continue;
    }
    const converted = convertAttrForRN(name, value);
    if (converted) props[converted[0]] = converted[1];
  }
  // Inline style wins over presentation attributes of the same name, mirroring
  // normal CSS/SVG cascade precedence. `filter` can arrive via a style
  // declaration too (style="...;filter:url(#x)") — drop it the same as a
  // direct attribute, since <filter> defs never survive stripToInner().
  delete styleProps.filter;
  Object.assign(props, styleProps);
  return props;
}

/**
 * A single element in an icon's render tree: [tagName, props, children].
 * `children` is omitted for leaf/self-closing elements. Text nodes (only
 * meaningful under <text>/<tspan>) are plain strings.
 */
type SvgNode = readonly [string, Record<string, string>] | readonly [string, Record<string, string>, readonly (SvgNode | string)[]];

/**
 * Parse SVG inner markup into a tree of [tagName, props, children] tuples.
 * Same regex-based approach as @thesvg/react's convertJsxToCjs (no full
 * DOM/XML parser, to stay zero-runtime-dep) — targeted tag/attr matching
 * plus depth-aware close-tag search for nested same-type elements (e.g. <g>
 * inside <g>).
 */
function parseNodes(markup: string): (SvgNode | string)[] {
  const nodes: (SvgNode | string)[] = [];
  const tagRe = /<([a-zA-Z][a-zA-Z0-9:.-]*)([^>]*?)(\/?)>/g;
  let remaining = markup;

  while (remaining.length > 0) {
    const tagMatch = tagRe.exec(remaining);
    if (!tagMatch) {
      const text = remaining.trim();
      if (text) nodes.push(text);
      break;
    }

    const textBefore = remaining.slice(0, tagMatch.index).trim();
    if (textBefore) nodes.push(textBefore);

    const tagName = tagMatch[1];
    const attrsRaw = tagMatch[2].trim();
    const isSelfClosing = tagMatch[3] === "/";
    const matchEnd = tagMatch.index + tagMatch[0].length;
    const props = attrsToProps(attrsRaw);

    if (isSelfClosing) {
      nodes.push([tagName, props]);
    } else {
      const afterOpen = remaining.slice(matchEnd);
      const closeIdx = findMatchingCloseTag(afterOpen, tagName);
      if (closeIdx >= 0) {
        const innerContent = afterOpen.slice(0, closeIdx);
        const closeTagLen = `</${tagName}>`.length;
        const children = parseNodes(innerContent);
        nodes.push(children.length > 0 ? [tagName, props, children] : [tagName, props]);
        remaining = afterOpen.slice(closeIdx + closeTagLen);
        tagRe.lastIndex = 0;
        continue;
      }
      // No matching close tag found — treat as self-closing.
      nodes.push([tagName, props]);
    }

    remaining = remaining.slice(matchEnd);
    tagRe.lastIndex = 0;
  }

  return nodes;
}

/**
 * Find the index of the matching close tag in `html` for a given `tagName`,
 * correctly handling nested elements of the same type. Returns -1 if none found.
 */
function findMatchingCloseTag(html: string, tagName: string): number {
  const openRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, "g");
  const closeRe = new RegExp(`</${tagName}>`, "g");
  let depth = 1;
  let pos = 0;

  while (depth > 0 && pos < html.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;

    const openMatch = openRe.exec(html);
    const closeMatch = closeRe.exec(html);

    if (!closeMatch) return -1;

    if (openMatch && openMatch.index < closeMatch.index) {
      if (!openMatch[0].endsWith("/>")) depth++;
      pos = openMatch.index + openMatch[0].length;
    } else {
      depth--;
      if (depth === 0) return closeMatch.index;
      pos = closeMatch.index + closeMatch[0].length;
    }
  }

  return -1;
}

/**
 * Tags the shared runtime knows how to render, mapped to their
 * react-native-svg export names. Kept as the single source of truth so the
 * codegen (this file) and the runtime (generateRuntime* below) never drift.
 */
const TAG_COMPONENT_MAP: Record<string, string> = {
  g: "G",
  path: "Path",
  circle: "Circle",
  rect: "Rect",
  ellipse: "Ellipse",
  line: "Line",
  polygon: "Polygon",
  polyline: "Polyline",
  defs: "Defs",
  linearGradient: "LinearGradient",
  radialGradient: "RadialGradient",
  stop: "Stop",
  clipPath: "ClipPath",
  mask: "Mask",
  use: "Use",
  text: "Text",
  tspan: "TSpan",
};

/**
 * Drop any tag not in TAG_COMPONENT_MAP, flattening its children up into the
 * parent so nested visual content (e.g. an unsupported wrapper like <a> or
 * <symbol> around a <path>) isn't silently lost. Tracks every dropped tag
 * name in `unsupported` for the build summary.
 */
function pruneUnsupported(nodes: readonly (SvgNode | string)[], unsupported: Set<string>): (SvgNode | string)[] {
  const out: (SvgNode | string)[] = [];
  for (const node of nodes) {
    if (typeof node === "string") {
      out.push(node);
      continue;
    }
    const [tag, props, children] = node;
    const prunedChildren = children ? pruneUnsupported(children, unsupported) : undefined;
    if (Object.prototype.hasOwnProperty.call(TAG_COMPONENT_MAP, tag)) {
      out.push(prunedChildren && prunedChildren.length > 0 ? [tag, props, prunedChildren] : [tag, props]);
    } else {
      unsupported.add(tag);
      if (prunedChildren && prunedChildren.length > 0) out.push(...prunedChildren);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// PascalCase / identifier helpers (identical to @thesvg/react)
// ---------------------------------------------------------------------------

/**
 * Convert a slug to a PascalCase component name.
 * Examples: github -> Github, visual-studio-code -> VisualStudioCode,
 * 01dotai -> I01Dotai (numeric-leading names get an "I" prefix for validity).
 */
function toPascalCase(slug: string): string {
  const pascal = slug
    .split(/[-._]+/)
    .map((segment) => {
      if (segment.length === 0) return "";
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join("");

  if (/^[0-9]/.test(pascal)) return `I${pascal}`;
  return pascal;
}

/** Slug -> valid JS identifier for the CJS barrel's local require() bindings. */
function toSafeIdentifier(slug: string): string {
  let id = slug.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(id)) id = `i_${id}`;
  return id;
}

// ---------------------------------------------------------------------------
// Per-icon parsing
// ---------------------------------------------------------------------------

interface ParsedVariant {
  viewBox: string;
  fill: string;
  stroke?: string;
  children: (SvgNode | string)[];
}

interface ParsedIcon {
  /** Ordered variant keys, always starting with "default". */
  keys: string[];
  variants: Record<string, ParsedVariant>;
}

function parseVariant(publicPath: string, unsupported: Set<string>): ParsedVariant | null {
  const svgContent = readSvg(publicPath);
  if (!svgContent) return null;
  const { inner, viewBox, fill, stroke } = stripToInner(svgContent);
  const children = pruneUnsupported(parseNodes(inner), unsupported);
  return { viewBox, fill, stroke, children };
}

/**
 * Parse every variant declared for an icon, once, for reuse by ESM/CJS/d.ts
 * generation. "default" always maps to the icon's primary SVG (default ->
 * color -> mono -> ... fallback), matching @thesvg/react's resolution order.
 */
function parseSvgForIcon(icon: RawIcon, unsupported: Set<string>): ParsedIcon | null {
  const svgContent = primarySvg(icon.variants);
  if (!svgContent) return null;

  const { inner, viewBox, fill, stroke } = stripToInner(svgContent);
  const variants: Record<string, ParsedVariant> = {
    default: { viewBox, fill, stroke, children: pruneUnsupported(parseNodes(inner), unsupported) },
  };

  for (const [key, path] of Object.entries(icon.variants)) {
    if (key === "default" || !path) continue;
    const parsed = parseVariant(path, unsupported);
    if (parsed) {
      if (key === "mono" && parsed.fill === "none") {
        parsed.fill = "currentColor";
      }
      variants[key] = parsed;
    }
  }

  return { keys: Object.keys(variants), variants };
}

// ---------------------------------------------------------------------------
// Shared runtime (createIcon) — emitted once, not per icon
// ---------------------------------------------------------------------------

function generateRuntimeEsm(): string {
  return [
    `// @thesvg/react-native — shared icon runtime`,
    `// Auto-generated. Do not edit.`,
    `//`,
    `// Renders an icon's [tagName, props, children] data tree by resolving each`,
    `// tag name against react-native-svg's exports. One copy of this logic is`,
    `// shared by every generated icon module (see icons/*.js), which is why`,
    `// icon modules can be pure data instead of one inline component each.`,
    ``,
    `import { createElement, forwardRef } from 'react';`,
    `import {`,
    `  Svg, G, Path, Circle, Rect, Ellipse, Line, Polygon, Polyline,`,
    `  Defs, LinearGradient, RadialGradient, Stop, ClipPath, Mask, Use, Text, TSpan,`,
    `} from 'react-native-svg';`,
    ``,
    `const TAG_COMPONENTS = {`,
    `  g: G, path: Path, circle: Circle, rect: Rect, ellipse: Ellipse,`,
    `  line: Line, polygon: Polygon, polyline: Polyline, defs: Defs,`,
    `  linearGradient: LinearGradient, radialGradient: RadialGradient, stop: Stop,`,
    `  clipPath: ClipPath, mask: Mask, use: Use, text: Text, tspan: TSpan,`,
    `};`,
    ``,
    `const RESERVED_PROPS = { variant: 1, color: 1, size: 1, width: 1, height: 1, fill: 1, stroke: 1 };`,
    ``,
    `function renderNode(node, key) {`,
    `  if (typeof node === 'string') return node;`,
    `  const Component = TAG_COMPONENTS[node[0]];`,
    `  if (!Component) return null;`,
    `  const children = node[2] ? node[2].map(renderNode) : undefined;`,
    `  return createElement(Component, Object.assign({ key: key }, node[1]), children);`,
    `}`,
    ``,
    `export function createIcon(name, variants) {`,
    `  const IconComponent = forwardRef(function (props, ref) {`,
    `    const variant = props.variant || 'default';`,
    `    const data = variants[variant] || variants.default;`,
    `    const width = props.width !== undefined ? props.width : (props.size !== undefined ? props.size : 24);`,
    `    const height = props.height !== undefined ? props.height : (props.size !== undefined ? props.size : 24);`,
    `    const fill = props.fill !== undefined ? props.fill : (props.color !== undefined ? props.color : data.fill);`,
    `    const stroke = props.stroke !== undefined`,
    `      ? props.stroke`,
    `      : (props.color !== undefined && data.stroke !== undefined ? props.color : data.stroke);`,
    `    const rest = {};`,
    `    for (const k in props) { if (!RESERVED_PROPS[k]) rest[k] = props[k]; }`,
    `    const svgProps = Object.assign(`,
    `      { ref: ref, viewBox: data.viewBox, width: width, height: height, fill: fill },`,
    `      stroke !== undefined ? { stroke: stroke } : {},`,
    `      rest,`,
    `    );`,
    `    return createElement(Svg, svgProps, data.children.map(renderNode));`,
    `  });`,
    `  IconComponent.displayName = name;`,
    `  return IconComponent;`,
    `}`,
  ].join("\n");
}

function generateRuntimeCjs(): string {
  return [
    `"use strict";`,
    `// @thesvg/react-native — shared icon runtime`,
    `// Auto-generated. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
    `const react_1 = require("react");`,
    `const svg_1 = require("react-native-svg");`,
    ``,
    `const TAG_COMPONENTS = {`,
    `  g: svg_1.G, path: svg_1.Path, circle: svg_1.Circle, rect: svg_1.Rect, ellipse: svg_1.Ellipse,`,
    `  line: svg_1.Line, polygon: svg_1.Polygon, polyline: svg_1.Polyline, defs: svg_1.Defs,`,
    `  linearGradient: svg_1.LinearGradient, radialGradient: svg_1.RadialGradient, stop: svg_1.Stop,`,
    `  clipPath: svg_1.ClipPath, mask: svg_1.Mask, use: svg_1.Use, text: svg_1.Text, tspan: svg_1.TSpan,`,
    `};`,
    ``,
    `const RESERVED_PROPS = { variant: 1, color: 1, size: 1, width: 1, height: 1, fill: 1, stroke: 1 };`,
    ``,
    `function renderNode(node, key) {`,
    `  if (typeof node === 'string') return node;`,
    `  const Component = TAG_COMPONENTS[node[0]];`,
    `  if (!Component) return null;`,
    `  const children = node[2] ? node[2].map(renderNode) : undefined;`,
    `  return react_1.createElement(Component, Object.assign({ key: key }, node[1]), children);`,
    `}`,
    ``,
    `function createIcon(name, variants) {`,
    `  const IconComponent = react_1.forwardRef(function (props, ref) {`,
    `    const variant = props.variant || 'default';`,
    `    const data = variants[variant] || variants.default;`,
    `    const width = props.width !== undefined ? props.width : (props.size !== undefined ? props.size : 24);`,
    `    const height = props.height !== undefined ? props.height : (props.size !== undefined ? props.size : 24);`,
    `    const fill = props.fill !== undefined ? props.fill : (props.color !== undefined ? props.color : data.fill);`,
    `    const stroke = props.stroke !== undefined`,
    `      ? props.stroke`,
    `      : (props.color !== undefined && data.stroke !== undefined ? props.color : data.stroke);`,
    `    const rest = {};`,
    `    for (const k in props) { if (!RESERVED_PROPS[k]) rest[k] = props[k]; }`,
    `    const svgProps = Object.assign(`,
    `      { ref: ref, viewBox: data.viewBox, width: width, height: height, fill: fill },`,
    `      stroke !== undefined ? { stroke: stroke } : {},`,
    `      rest,`,
    `    );`,
    `    return react_1.createElement(svg_1.Svg, svgProps, data.children.map(renderNode));`,
    `  });`,
    `  IconComponent.displayName = name;`,
    `  return IconComponent;`,
    `}`,
    `exports.createIcon = createIcon;`,
  ].join("\n");
}

function generateRuntimeDts(): string {
  return [
    `// @thesvg/react-native — shared icon runtime types`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { ComponentRef, ForwardRefExoticComponent, RefAttributes } from 'react';`,
    `import type { Svg, SvgProps } from 'react-native-svg';`,
    ``,
    `/** One element in an icon's render tree: [tagName, props, children]. */`,
    `export type IconNode =`,
    `  | readonly [tag: string, props: Record<string, unknown>]`,
    `  | readonly [tag: string, props: Record<string, unknown>, children: readonly (IconNode | string)[]];`,
    ``,
    `export interface IconVariantData {`,
    `  viewBox: string;`,
    `  fill?: string;`,
    `  stroke?: string;`,
    `  children: readonly (IconNode | string)[];`,
    `}`,
    ``,
    `export interface IconProps extends Omit<SvgProps, 'children'> {`,
    `  /** Which icon variant to render. Defaults to "default". */`,
    `  variant?: string;`,
    `  /** Shorthand for both width and height. Ignored when width/height are set. Defaults to 24. */`,
    `  size?: number | string;`,
    `  /** Shorthand that sets both fill and stroke to a single color. */`,
    `  color?: string;`,
    `}`,
    ``,
    `export type IconComponent<V extends string = string> = ForwardRefExoticComponent<`,
    `  Omit<IconProps, 'variant'> & { variant?: V } & RefAttributes<ComponentRef<typeof Svg>>`,
    `>;`,
    ``,
    `export declare function createIcon<V extends string = string>(`,
    `  name: string,`,
    `  variants: Record<V, IconVariantData> & { default: IconVariantData },`,
    `): IconComponent<V>;`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Per-icon module generators
// ---------------------------------------------------------------------------

function generateEsmIconModule(icon: RawIcon, parsed: ParsedIcon | null): string {
  const componentName = toPascalCase(icon.slug);

  if (!parsed) {
    return [
      `// @thesvg/react-native — ${icon.title}`,
      `// Auto-generated. Do not edit.`,
      `// WARNING: SVG source not found for slug "${icon.slug}"`,
      ``,
      `import { createIcon } from '../createIcon.js';`,
      ``,
      `const _variants = { default: { viewBox: '0 0 24 24', fill: 'currentColor', children: [] } };`,
      ``,
      `const ${componentName} = createIcon('${componentName}', _variants);`,
      ``,
      `export default ${componentName};`,
    ].join("\n");
  }

  return [
    `// @thesvg/react-native — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    `// Variants: ${parsed.keys.join(", ")}`,
    ``,
    `import { createIcon } from '../createIcon.js';`,
    ``,
    `const _variants = ${JSON.stringify(parsed.variants)};`,
    ``,
    `const ${componentName} = createIcon('${componentName}', _variants);`,
    ``,
    `export default ${componentName};`,
  ].join("\n");
}

function generateCjsIconModule(icon: RawIcon, parsed: ParsedIcon | null): string {
  const componentName = toPascalCase(icon.slug);

  if (!parsed) {
    return [
      `"use strict";`,
      `// @thesvg/react-native — ${icon.title}`,
      `// Auto-generated. Do not edit.`,
      `// WARNING: SVG source not found for slug "${icon.slug}"`,
      ``,
      `Object.defineProperty(exports, "__esModule", { value: true });`,
      ``,
      `const { createIcon } = require('../createIcon.cjs');`,
      ``,
      `const _variants = { default: { viewBox: '0 0 24 24', fill: 'currentColor', children: [] } };`,
      ``,
      `const ${componentName} = createIcon('${componentName}', _variants);`,
      ``,
      `exports.default = ${componentName};`,
    ].join("\n");
  }

  return [
    `"use strict";`,
    `// @thesvg/react-native — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    `// Variants: ${parsed.keys.join(", ")}`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
    `const { createIcon } = require('../createIcon.cjs');`,
    ``,
    `const _variants = ${JSON.stringify(parsed.variants)};`,
    ``,
    `const ${componentName} = createIcon('${componentName}', _variants);`,
    ``,
    `exports.default = ${componentName};`,
  ].join("\n");
}

function generateDtsIconModule(icon: RawIcon, parsed: ParsedIcon | null): string {
  const componentName = toPascalCase(icon.slug);
  const variantKeys = parsed && parsed.keys.length > 0 ? parsed.keys : ["default"];
  const variantUnion = variantKeys.map((k) => `'${k}'`).join(" | ");
  return [
    `// @thesvg/react-native — ${icon.title}`,
    `// Auto-generated. Do not edit.`,
    ``,
    `import type { IconComponent } from '../createIcon.js';`,
    ``,
    `export type ${componentName}Variant = ${variantUnion};`,
    ``,
    `declare const ${componentName}: IconComponent<${componentName}Variant>;`,
    `export default ${componentName};`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Barrel generators
// ---------------------------------------------------------------------------

function generateEsmBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [`// @thesvg/react-native`, `// Auto-generated barrel. Do not edit.`, ``];
  for (const { slug, componentName } of entries) {
    lines.push(`export { default as ${componentName} } from './icons/${slug}.js';`);
  }
  return lines.join("\n");
}

function generateCjsBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `"use strict";`,
    `// @thesvg/react-native`,
    `// Auto-generated barrel. Do not edit.`,
    ``,
    `Object.defineProperty(exports, "__esModule", { value: true });`,
    ``,
  ];
  for (const { slug, componentName } of entries) {
    lines.push(
      `const _${toSafeIdentifier(slug)} = require('./icons/${slug}.cjs');`,
      `exports.${componentName} = _${toSafeIdentifier(slug)}.default;`,
    );
  }
  return lines.join("\n");
}

function generateDtsBarrel(entries: Array<{ slug: string; componentName: string }>): string {
  const lines = [
    `// @thesvg/react-native`,
    `// Auto-generated type barrel. Do not edit.`,
    ``,
    `export type { IconProps, IconComponent, IconNode, IconVariantData } from './createIcon.js';`,
    ``,
  ];
  for (const { componentName, slug } of entries) {
    lines.push(`export { default as ${componentName} } from './icons/${slug}.js';`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Build validation (fast structural sanity check; scripts/validate-output.ts
// does the deeper per-icon / variant-coverage pass)
// ---------------------------------------------------------------------------

function validateOutput(): boolean {
  console.log("\nValidating output...");
  let errors = 0;
  let totalSampled = 0;

  for (const ext of [".js", ".cjs"] as const) {
    const files = readdirSync(DIST_ICONS).filter((f) => f.endsWith(ext));
    const step = Math.max(1, Math.floor(files.length / 20));
    const sampled = new Set<string>();
    for (let i = 0; i < files.length && sampled.size < 20; i += step) {
      sampled.add(files[i]);
    }

    for (const file of sampled) {
      const content = readFileSync(join(DIST_ICONS, file), "utf8");

      if (ext === ".js" && /\bimport\s+type\b/.test(content)) {
        console.error(`  FAIL: icons/${file} contains "import type"`);
        errors++;
      }
      if (/return\s*\(?\s*<[a-zA-Z]/.test(content)) {
        console.error(`  FAIL: icons/${file} contains raw JSX syntax (should be data + createIcon)`);
        errors++;
      }
      if (/<\?xml|<!DOCTYPE|<style[\s>]|<title[\s>]|<filter[\s>]/i.test(content)) {
        console.error(`  FAIL: icons/${file} contains leftover XML/SVG-only markup`);
        errors++;
      }
      if (/"class"\s*:|"className"\s*:|"style"\s*:\s*"/.test(content)) {
        console.error(`  FAIL: icons/${file} contains a class/className/string-style prop react-native-svg can't use`);
        errors++;
      }
    }

    totalSampled += sampled.size;
  }

  if (errors === 0) {
    console.log(`  PASS: Validated ${totalSampled} icon files (ESM + CJS), no issues found.`);
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

  // Clean stale output first so components for removed/renamed slugs (orphans)
  // don't linger in dist and get shipped or flagged by the validator.
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST_ICONS, { recursive: true });

  // Shared runtime, emitted once.
  writeFileSync(join(DIST, "createIcon.js"), generateRuntimeEsm() + "\n");
  writeFileSync(join(DIST, "createIcon.cjs"), generateRuntimeCjs() + "\n");
  writeFileSync(join(DIST, "createIcon.d.ts"), generateRuntimeDts() + "\n");

  const entries: Array<{ slug: string; componentName: string }> = [];
  const unsupportedTags = new Set<string>();
  let skipped = 0;

  for (const icon of rawIcons) {
    const componentName = toPascalCase(icon.slug);
    const parsed = parseSvgForIcon(icon, unsupportedTags);
    if (!parsed) skipped++;

    writeFileSync(join(DIST_ICONS, `${icon.slug}.js`), generateEsmIconModule(icon, parsed) + "\n");
    writeFileSync(join(DIST_ICONS, `${icon.slug}.cjs`), generateCjsIconModule(icon, parsed) + "\n");
    writeFileSync(join(DIST_ICONS, `${icon.slug}.d.ts`), generateDtsIconModule(icon, parsed) + "\n");

    entries.push({ slug: icon.slug, componentName });

    if (entries.length % 500 === 0) {
      console.log(`  Processed ${entries.length} / ${rawIcons.length}…`);
    }
  }

  writeFileSync(join(DIST, "index.js"), generateEsmBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.cjs"), generateCjsBarrel(entries) + "\n");
  writeFileSync(join(DIST, "index.d.ts"), generateDtsBarrel(entries) + "\n");

  console.log(`\nDone. Built ${entries.length} icons (${skipped} had no SVG source).`);
  if (skipped > 0) {
    console.log(`  ${skipped} icons emitted an empty placeholder — check SVG paths.`);
  }
  if (unsupportedTags.size > 0) {
    console.log(
      `  ${unsupportedTags.size} unsupported SVG tag(s) encountered and flattened (children kept, wrapper dropped): ${[...unsupportedTags].sort().join(", ")}`,
    );
  }
  console.log(`Output: ${DIST}`);

  const valid = validateOutput();
  if (!valid) {
    process.exit(1);
  }
}

main();
