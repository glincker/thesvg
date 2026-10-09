/**
 * Regex based SVG sanitizer used by the icon enrichment scripts.
 *
 * Node scripts have no DOMParser, so this works on the markup string. It only
 * rewrites constructs inside tags (attributes) and removes whole dangerous
 * elements, so text content and <title> are never touched.
 */

const QUOTED_OR_PLAIN = `(?:"[^"]*"|'[^']*'|[^'">])*`;

const NAMED_ENTITIES: Record<string, string> = {
  colon: ":",
  tab: "\t",
  newline: "\n",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  lpar: "(",
  rpar: ")",
  sol: "/",
};

function safeFromCodePoint(n: number): string {
  return Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
}

function decodeEntitiesOnce(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex: string) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_m, dec: string) => safeFromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

/** Decode (repeatedly, for double encoding), strip whitespace/control chars, lowercase. */
function normalizeUrl(raw: string): string {
  let value = raw;
  for (let i = 0; i < 4; i++) {
    const next = decodeEntitiesOnce(value);
    if (next === value) break;
    value = next;
  }
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\s\u0000-\u001f\u007f]/g, "").toLowerCase();
}

function stripQuotes(v: string): string {
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'")) return v.slice(1, -1);
  return v;
}

const RASTER_DATA = /^data:image\/(?:png|jpe?g|gif|webp|avif)[;,]/;

/** True when an href value must be rejected on any element. */
export function isUnsafeHref(raw: string): boolean {
  const v = normalizeUrl(raw);
  if (v.startsWith("//")) return true;
  if (v.startsWith("javascript:") || v.startsWith("vbscript:")) return true;
  if (v.startsWith("data:")) return !RASTER_DATA.test(v);
  return false;
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
