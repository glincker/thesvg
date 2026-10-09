/**
 * Regex based SVG sanitizer used by the icon enrichment scripts.
 *
 * Node scripts have no DOMParser, so this works on the markup string. It only
 * rewrites constructs inside tags (attributes) and removes whole dangerous
 * elements, so text content and <title> are never touched.
 */

import { isUnsafeHref, normalizeUrl } from "../../../../src/lib/href-safety";

export { isUnsafeHref };

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
  const selfClosing = new RegExp(`<\\s*${name}\\b${QUOTED_OR_PLAIN}\\/\\s*>`, "gi");
  const paired = new RegExp(`<\\s*${name}\\b[\\s\\S]*?<\\s*\\/\\s*${name}\\s*>`, "gi");
  const stray = new RegExp(`<\\s*\\/?\\s*${name}\\b${QUOTED_OR_PLAIN}>`, "gi");
  let prev: string;
  let out = input;
  do {
    prev = out;
    out = out.replace(selfClosing, "").replace(paired, "").replace(stray, "");
  } while (out !== prev);
  return out;
}

function removeUnsafeUse(input: string): string {
  const useRe = new RegExp(`<use\\b${QUOTED_OR_PLAIN}>`, "gi");
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = useRe.exec(input)) !== null) {
    const tag = m[0];
    const hrefs = parseTag(tag).attrs.filter((a) => HREF_NAME.test(a.name));
    const bad = hrefs.some((a) => !normalizeUrl(a.value ?? "").startsWith("#"));
    if (!bad) continue;
    out += input.slice(last, m.index);
    last = m.index + tag.length;
    if (!/\/\s*>$/.test(tag)) {
      const close = /<\s*\/\s*use\s*>/i.exec(input.slice(last));
      if (close) last += close.index + close[0].length;
    }
    useRe.lastIndex = last;
  }
  return out + input.slice(last);
}

function cleanTag(tag: string): string {
  const nameMatch = /^<[^\s/>]+/.exec(tag);
  if (!nameMatch) return tag;
  const head = nameMatch[0];
  const rest = tag.slice(head.length);
  const cleaned = rest.replace(
    ATTR_RE,
    (match: string, _ws: string, name: string, rawValue: string | undefined) => {
      if (/^on/i.test(name)) return "";
      if (HREF_NAME.test(name) && isUnsafeHref(stripQuotes(rawValue ?? ""))) return "";
      return match;
    },
  );
  return head + cleaned;
}

/**
 * Sanitize SVG markup: remove <script> and <foreignObject> elements, remove
 * <use> elements pointing outside the document, and strip on* handlers and
 * unsafe href values from tag attributes.
 */
export function sanitizeSvg(content: string): string {
  let result = removeElements(content, "script");
  result = removeElements(result, "foreignObject");
  result = removeUnsafeUse(result);
  return result.replace(new RegExp(`<[a-zA-Z]${QUOTED_OR_PLAIN}>`, "g"), cleanTag);
}
