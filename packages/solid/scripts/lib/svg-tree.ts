/**
 * svg-tree.ts
 *
 * Framework-neutral core shared by the @thesvg/solid and @thesvg/preact
 * builders (kept as an identical copy in each package). Turns an icon's SVG
 * files into a plain element tree plus the root paint, and holds the naming
 * helpers. Attribute names are kept as written in the SVG (kebab-case), which
 * is what both Solid and Preact expect on SVG elements.
 */

import { join } from "node:path";

import { publicSvgReader } from "../../../icons/scripts/lib/public-svg.ts";
import { primarySvg, readIconSvg } from "../../../icons/scripts/lib/variants.ts";

export interface RawIcon {
  slug: string;
  title: string;
  variants: Record<string, string | undefined>;
}

export interface SvgNode {
  type: string;
  props: Record<string, string>;
  children: (SvgNode | string)[];
}

export interface ParsedSvg {
  viewBox: string;
  fill: string;
  stroke?: string;
  childNodes: (SvgNode | string)[];
}

export interface ParsedIcon {
  /** Ordered variant keys, always starting with "default". */
  keys: string[];
  variants: Record<string, ParsedSvg>;
}

export function makeReader(repoRoot: string): (publicPath: string) => string {
  return publicSvgReader(join(repoRoot, "public"));
}

/** Drops editor noise and namespace declarations the framework adds itself. */
function keepAttr(name: string): boolean {
  if (name === "xmlns" || name.startsWith("xmlns:")) return false;
  return !/^(inkscape|sodipodi|xml|dc|cc|rdf):/.test(name);
}

function extractRootPaint(svg: string): { fill: string; stroke?: string } {
  const tag = svg.match(/<svg[^>]*>/s);
  if (!tag) return { fill: "currentColor" };
  const fill = tag[0].match(/\bfill=["']([^"']+)["']/);
  const stroke = tag[0].match(/\bstroke=["']([^"']+)["']/);
  // Stroke-only icons must not get a filled root; everything else inherits text color.
  return {
    fill: fill ? fill[1] : stroke ? "none" : "currentColor",
    stroke: stroke ? stroke[1] : undefined,
  };
}

function findMatchingClose(html: string, tag: string): number {
  const open = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "g");
  const close = new RegExp(`</${tag}>`, "g");
  let depth = 1;
  let pos = 0;
  while (pos < html.length) {
    open.lastIndex = pos;
    close.lastIndex = pos;
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) return -1;
    if (o && o.index < c.index) {
      if (!o[0].endsWith("/>")) depth++;
      pos = o.index + o[0].length;
    } else {
      depth--;
      if (depth === 0) return c.index;
      pos = c.index + c[0].length;
    }
  }
  return -1;
}

function parseNodes(src: string): (SvgNode | string)[] {
  const nodes: (SvgNode | string)[] = [];
  const tagRe = /<([a-zA-Z][a-zA-Z0-9:.-]*)([^>]*?)(\/?)>/g;
  let rest = src;

  while (rest.length > 0) {
    tagRe.lastIndex = 0;
    const m = tagRe.exec(rest);
    if (!m) {
      const text = rest.trim();
      if (text) nodes.push(text);
      break;
    }
    const before = rest.slice(0, m.index).trim();
    if (before) nodes.push(before);

    const props: Record<string, string> = {};
    const attrRe = /([a-zA-Z_][a-zA-Z0-9:_-]*)=(?:"([^"]*)"|'([^']*)')/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(m[2])) !== null) {
      const value = a[2] ?? a[3] ?? "";
      if (a[1] === "xlink:href") props.href = value;
      else if (keepAttr(a[1])) props[a[1]] = value;
    }

    const node: SvgNode = { type: m[1], props, children: [] };
    const end = m.index + m[0].length;
    if (m[3] === "/") {
      nodes.push(node);
      rest = rest.slice(end);
      continue;
    }
    const after = rest.slice(end);
    const closeAt = findMatchingClose(after, m[1]);
    if (closeAt >= 0) {
      node.children = parseNodes(after.slice(0, closeAt));
      nodes.push(node);
      rest = after.slice(closeAt + `</${m[1]}>`.length);
    } else {
      nodes.push(node);
      rest = after;
    }
  }
  return nodes;
}

export function parseSvg(svg: string): ParsedSvg {
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/)?.[1] ?? "0 0 24 24";
  const { fill, stroke } = extractRootPaint(svg);

  const inner = svg
    .replace(/^<svg[^>]*>/s, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<\?xml[^?]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<sodipodi:[^>]*(?:\/>|>[\s\S]*?<\/sodipodi:[^>]+>)/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<(rdf|dc|cc):[^>]*(?:\/>|>[\s\S]*?<\/\1:[^>]+>)/g, "")
    // Nested <svg> wrappers from editor exports: keep their children only.
    .replace(/<svg[^>]*>/gs, "")
    .replace(/<\/svg>/g, "")
    .trim();

  return { viewBox, fill, stroke, childNodes: parseNodes(inner) };
}

/** Parse every variant of an icon once. Null when no SVG exists. */
export function parseIcon(icon: RawIcon, read: (p: string) => string): ParsedIcon | null {
  const primary = primarySvg(icon.variants, read);
  if (!primary) return null;

  const variants: Record<string, ParsedSvg> = { default: parseSvg(primary) };
  for (const [key, path] of Object.entries(icon.variants)) {
    if (key === "default" || !path) continue;
    const svg = readIconSvg(path, read);
    if (!svg) continue;
    const parsed = parseSvg(svg);
    if (key === "mono" && parsed.fill === "none") parsed.fill = "currentColor";
    variants[key] = parsed;
  }
  return { keys: Object.keys(variants), variants };
}

/**
 * True when any variant uses internal ids (gradients, masks, clipPaths).
 * Those ids share the document scope, so they must be prefixed per render
 * or two icons on one page corrupt each other's gradients.
 */
export function needsIdNamespacing(parsed: ParsedIcon): boolean {
  const json = JSON.stringify(parsed.variants);
  return json.includes("url(#") || /"id":/.test(json) || /"href":"#/.test(json);
}

export function toPascalCase(slug: string): string {
  const pascal = slug
    .split(/[-._]+/)
    .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""))
    .join("");
  return /^[0-9]/.test(pascal) ? `I${pascal}` : pascal;
}

export function toSafeIdentifier(slug: string): string {
  const id = slug.replace(/[^a-zA-Z0-9_]/g, "_");
  return /^[0-9]/.test(id) ? `i_${id}` : id;
}

export function variantUnion(parsed: ParsedIcon | null): string {
  const keys = parsed && parsed.keys.length > 0 ? parsed.keys : ["default"];
  return keys.map((k) => `'${k}'`).join(" | ");
}
