/**
 * svg-tree.ts
 *
 * Framework-neutral core shared by the @thesvg/solid, @thesvg/preact and
 * @thesvg/astro builders (kept as an identical copy in each package). Turns an icon's SVG
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
  /** Every other root attribute from the source (stroke, stroke-width, ...). */
  attrs: Record<string, string>;
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

// CSS properties that exist as SVG presentation attributes. Anything else a
// <style> rule sets (transform, mix-blend-mode, ...) goes into a style string.
const PRESENTATION = new Set([
  "clip-path", "clip-rule", "color", "display", "fill", "fill-opacity", "fill-rule", "filter",
  "flood-color", "flood-opacity", "lighting-color", "marker-start", "marker-mid", "marker-end",
  "mask", "opacity", "paint-order", "shape-rendering", "stop-color", "stop-opacity", "stroke",
  "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin",
  "stroke-miterlimit", "stroke-opacity", "stroke-width", "visibility",
]);

interface CssRule {
  selector: string;
  spec: number;
  order: number;
  decls: [string, string][];
}

function parseDecls(body: string): [string, string][] {
  const out: [string, string][] = [];
  for (const part of body.split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const prop = part.slice(0, i).trim().toLowerCase();
    const value = part.slice(i + 1).replace(/!important/i, "").trim();
    if (prop && value) out.push([prop, value]);
  }
  return out;
}

/** Only flat selectors are resolvable: .a, tag, tag.a, #id, *. Others are skipped. */
function simpleSelector(sel: string): { spec: number } | null {
  if (!/^(\*|[a-zA-Z][a-zA-Z0-9]*)?(\.[a-zA-Z_][\w-]*|#[a-zA-Z_][\w-]*)*$/.test(sel) || sel === "") return null;
  const ids = (sel.match(/#/g) ?? []).length;
  const classes = (sel.match(/\./g) ?? []).length;
  const tag = /^[a-zA-Z]/.test(sel) ? 1 : 0;
  return { spec: ids * 100 + classes * 10 + tag };
}

function parseCss(css: string, rules: CssRule[]): void {
  const text = css.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    // Find the matching close so nested at-rule bodies (@media, @container) are skipped whole.
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") depth--;
      j++;
    }
    const head = text.slice(i, open).trim();
    const body = text.slice(open + 1, j - 1);
    i = j;
    // Conditional blocks cannot be baked into static attributes.
    if (head.startsWith("@")) continue;
    const decls = parseDecls(body);
    for (const sel of head.split(",")) {
      const s = simpleSelector(sel.trim());
      if (s) rules.push({ selector: sel.trim(), spec: s.spec, order: rules.length, decls });
    }
  }
}

function matches(selector: string, node: SvgNode): boolean {
  const tag = selector.match(/^[a-zA-Z][a-zA-Z0-9]*/)?.[0];
  if (tag && tag !== node.type) return false;
  const classes = (node.props.class ?? "").split(/\s+/);
  for (const c of selector.matchAll(/\.([\w-]+)/g)) if (!classes.includes(c[1])) return false;
  for (const i of selector.matchAll(/#([\w-]+)/g)) if (node.props.id !== i[1]) return false;
  return true;
}

/**
 * Bakes <style> rules into the matching elements and removes the blocks, so
 * icons paint the same without leaking global CSS. Inline style="" wins over
 * rules, as in a browser.
 */
function applyStyles(node: SvgNode, rules: CssRule[]): void {
  if (node.type !== "style") {
    const won = new Map<string, { value: string; spec: number; order: number }>();
    for (const r of rules) {
      if (!matches(r.selector, node)) continue;
      for (const [prop, value] of r.decls) {
        const cur = won.get(prop);
        if (!cur || r.spec > cur.spec || (r.spec === cur.spec && r.order > cur.order)) {
          won.set(prop, { value, spec: r.spec, order: r.order });
        }
      }
    }
    const inline = new Set(parseDecls(node.props.style ?? "").map(([p]) => p));
    let extra = "";
    for (const [prop, { value }] of won) {
      if (inline.has(prop)) continue;
      if (PRESENTATION.has(prop)) node.props[prop] = value;
      else extra += `${prop}:${value};`;
    }
    if (extra) node.props.style = (node.props.style ? node.props.style.replace(/;?\s*$/, ";") : "") + extra;
    if (rules.length > 0) delete node.props.class;
  }
  node.children = node.children.filter((c) => typeof c === "string" || c.type !== "style");
  for (const c of node.children) if (typeof c !== "string") applyStyles(c, rules);
}

function collectCss(src: string): string[] {
  return [...src.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
}

export function parseSvg(svg: string): ParsedSvg {
  const clean = svg
    .replace(/<\?xml[^?]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<sodipodi:[^>]*(?:\/>|>[\s\S]*?<\/sodipodi:[^>]+>)/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/g, "")
    .replace(/<(rdf|dc|cc):[^>]*(?:\/>|>[\s\S]*?<\/\1:[^>]+>)/g, "")
    .trim();

  const rules: CssRule[] = [];
  for (const css of collectCss(clean)) parseCss(css, rules);

  const root = parseNodes(clean).find((n): n is SvgNode => typeof n !== "string" && n.type === "svg");
  if (!root) return { viewBox: "0 0 24 24", fill: "currentColor", attrs: {}, childNodes: [] };
  applyStyles(root, rules);

  const attrs = { ...root.props };
  // Size comes from the caller or viewBox; a shared root id would collide across icons.
  const w = parseFloat(attrs.width ?? "");
  const h = parseFloat(attrs.height ?? "");
  const viewBox = attrs.viewBox ?? (w > 0 && h > 0 ? `0 0 ${w} ${h}` : "0 0 24 24");
  const fill = attrs.fill ?? (attrs.stroke ? "none" : "currentColor");
  for (const k of ["viewBox", "fill", "width", "height", "id"]) delete attrs[k];

  return { viewBox, fill, attrs, childNodes: root.children };
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
    variants[key] = parseSvg(svg);
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
  return /url\(\s*(?:&quot;|["'])?#/.test(json) || /"id":/.test(json) || /"href":"#/.test(json);
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
