/**
 * Extremely small XML tag walker, sufficient for well-formed icon SVGs
 * (no validation, no entity handling beyond what regex tag-splitting
 * naturally tolerates). Used by svg-path-to-polygons.ts as the tree the
 * paint walker recurses over.
 */

export interface Attrs {
  [key: string]: string;
}

function parseAttrs(tagBody: string): Attrs {
  const attrs: Attrs = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tagBody))) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3];
  }
  return attrs;
}

export interface XmlNode {
  tag: string;
  attrs: Attrs;
  children: XmlNode[];
  selfClosing: boolean;
}

/** Tags that never render their own geometry, and whose children are
 * likewise never rendered by simply walking the tree (they only ever
 * contribute content when explicitly referenced, e.g. via `<use>`, or
 * have no renderable content of their own at all). */
export const VOID_UNSUPPORTED = new Set([
  "defs",
  "clippath",
  "mask",
  "style",
  "title",
  "desc",
  "symbol",
  "text",
  "tspan",
  "filter",
  "lineargradient",
  "radialgradient",
  "metadata",
]);

export function parseXml(src: string): XmlNode | null {
  const cleaned = src
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "");

  const tagRe = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  const stack: XmlNode[] = [];
  let root: XmlNode | null = null;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(cleaned))) {
    const [, closing, tagNameRaw, body, selfClose] = m;
    const tagName = tagNameRaw.toLowerCase();
    if (closing) {
      if (stack.length && stack[stack.length - 1].tag === tagName) {
        stack.pop();
      }
      continue;
    }
    const node: XmlNode = {
      tag: tagName,
      attrs: parseAttrs(body),
      children: [],
      selfClosing: Boolean(selfClose),
    };
    if (!root) root = node;
    if (stack.length) stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}
