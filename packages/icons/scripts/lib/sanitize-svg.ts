/**
 * Regex based SVG sanitizer used by the icon enrichment scripts.
 *
 * Node scripts have no DOMParser, so this works on the markup string. It only
 * rewrites constructs inside tags (attributes) and removes whole dangerous
 * elements, so text content and <title> are never touched.
 */

import { isUnsafeHref, normalizeUrl } from "../../../../src/lib/href-safety";

export { isUnsafeHref };

// Optional XML namespace prefix, so x:script is matched by its local name.
const NS = "(?:[^\\s<>/:]+:)?";

const QUOTED_OR_PLAIN = `(?:"[^"]*"|'[^']*'|[^'">])*`;

function stripQuotes(v: string): string {
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'")) return v.slice(1, -1);
  return v;
}

const HREF_NAME = /^(?:[a-z][a-z0-9]*:)?href$/i;
const ATTR_RE = /(\s*)([^\s=/"'<>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+?(?=\s|\/?>|$)))?/g;

interface ParsedTag {
  name: string;
  attrs: Array<{ name: string; value: string | null }>;
}

function parseTag(tag: string): ParsedTag {
  const nameMatch = /^<([^\s/>]+)/.exec(tag);
  const name = nameMatch ? nameMatch[1] : "";
  const rest = tag.slice(nameMatch ? nameMatch[0].length : 0);
  const attrs: ParsedTag["attrs"] = [];
  for (const m of rest.matchAll(ATTR_RE)) {
    attrs.push({ name: m[2], value: m[3] === undefined ? null : stripQuotes(m[3]) });
  }
  return { name, attrs };
}

function removeElements(input: string, name: string): string {
  const selfClosing = new RegExp(`<\\s*${NS}${name}\\b${QUOTED_OR_PLAIN}\\/\\s*>`, "gi");
  const paired = new RegExp(
    `<\\s*${NS}${name}\\b[\\s\\S]*?<\\s*\\/\\s*${NS}${name}\\s*>`,
    "gi",
  );
  const stray = new RegExp(`<\\s*\\/?\\s*${NS}${name}\\b${QUOTED_OR_PLAIN}>`, "gi");
  let prev: string;
  let out = input;
  do {
    prev = out;
    out = out.replace(selfClosing, "").replace(paired, "").replace(stray, "");
  } while (out !== prev);
  return out;
}

/** Drop elements (and their closing tag) whose opening tag satisfies `isBad`. */
function removeTagsWhere(input: string, name: string, isBad: (tag: ParsedTag) => boolean): string {
  const tagRe = new RegExp(`<${NS}${name}\\b${QUOTED_OR_PLAIN}>`, "gi");
  const closeRe = new RegExp(`<\\s*\\/\\s*${NS}${name}\\s*>`, "i");
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(input)) !== null) {
    const tag = m[0];
    if (!isBad(parseTag(tag))) continue;
    out += input.slice(last, m.index);
    last = m.index + tag.length;
    if (!/\/\s*>$/.test(tag)) {
      const close = closeRe.exec(input.slice(last));
      if (close) last += close.index + close[0].length;
    }
    tagRe.lastIndex = last;
  }
  return out + input.slice(last);
}

function removeUnsafeUse(input: string): string {
  return removeTagsWhere(input, "use", (t) =>
    t.attrs
      .filter((a) => HREF_NAME.test(a.name))
      .some((a) => !normalizeUrl(a.value ?? "").startsWith("#")),
  );
}

// SMIL can rewrite href to a javascript: URL at runtime, so drop any
// animate/set that targets it, whatever the value.
function removeHrefAnimation(input: string): string {
  let out = input;
  for (const name of ["animate", "set"]) {
    out = removeTagsWhere(out, name, (t) =>
      t.attrs.some(
        (a) => /^attributename$/i.test(a.name) && HREF_NAME.test(normalizeUrl(a.value ?? "")),
      ),
    );
  }
  return out;
}

/** True when a value holds a url() reference that is not a same-document fragment. */
function hasExternalUrl(raw: string): boolean {
  const v = normalizeUrl(raw).replace(/\/\*.*?\*\//g, "");
  let i = v.indexOf("url(");
  while (i !== -1) {
    const target = v.slice(i + 4).replace(/^["']/, "");
    if (!target.startsWith("#")) return true;
    i = v.indexOf("url(", i + 4);
  }
  return false;
}

// A CSS backslash escape can spell url( past the check above, so drop those too.
function declarationUnsafe(decl: string): boolean {
  return hasExternalUrl(decl) || decl.includes("\\");
}

function cleanStyleValue(raw: string): string | null {
  const quote = raw[0] === '"' || raw[0] === "'" ? raw[0] : "";
  const inner = quote ? raw.slice(1, -1) : raw;
  if (!declarationUnsafe(inner)) return raw;
  const kept = inner.split(";").filter((d) => !declarationUnsafe(d));
  const joined = kept.join(";");
  if (kept.length === 0 || declarationUnsafe(joined)) return null;
  return quote + joined + quote;
}

function cleanTag(tag: string): string {
  const nameMatch = /^<[^\s/>]+/.exec(tag);
  if (!nameMatch) return tag;
  const head = nameMatch[0];
  const rest = tag.slice(head.length);
  const cleaned = rest.replace(
    ATTR_RE,
    (match: string, ws: string, name: string, rawValue: string | undefined) => {
      if (/^on/i.test(name)) return "";
      if (HREF_NAME.test(name) && isUnsafeHref(stripQuotes(rawValue ?? ""))) return "";
      if (rawValue === undefined) return match;
      if (/^style$/i.test(name)) {
        const style = cleanStyleValue(rawValue);
        if (style === null) return "";
        return style === rawValue ? match : `${ws}${name}=${style}`;
      }
      if (hasExternalUrl(stripQuotes(rawValue))) return "";
      return match;
    },
  );
  return head + cleaned;
}

/**
 * Sanitize SVG markup: remove <script> and <foreignObject> elements (any
 * namespace prefix), remove <use> elements pointing outside the document,
 * remove <animate>/<set> that target href, drop url() values that are not
 * #fragments, and strip on* handlers and unsafe href values from tag attributes.
 */
export function sanitizeSvg(content: string): string {
  let result = removeElements(content, "script");
  result = removeElements(result, "foreignObject");
  result = removeUnsafeUse(result);
  result = removeHrefAnimation(result);
  return result.replace(new RegExp(`<[a-zA-Z]${QUOTED_OR_PLAIN}>`, "g"), cleanTag);
}
