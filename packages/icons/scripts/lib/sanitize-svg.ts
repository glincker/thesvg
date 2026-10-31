/**
 * Regex based SVG sanitizer used by the icon enrichment scripts.
 *
 * Node scripts have no DOMParser, so this works on the markup string. It only
 * rewrites constructs inside tags (attributes) and removes whole dangerous
 * elements, so text content and <title> are never touched.
 */

import { isUnsafeHref, normalizeUrl } from "../../../../src/lib/href-safety";

export { isUnsafeHref };

import { JSDOM } from "jsdom";

const HREF_NAME = /^(?:[a-z][a-z0-9]*:)?href$/i;
const XLINK_HREF_NAME = /^xlink:href$/i;

/**
 * Sanitize SVG markup: remove <script> and <foreignObject> elements, remove
 * <use> elements pointing outside the document, and strip on* handlers and
 * unsafe href values from tag attributes.
 */
export function sanitizeSvg(content: string): string {
  const dom = new JSDOM("");
  const parser = new dom.window.DOMParser();
  let doc = parser.parseFromString(content, "image/svg+xml");

  if (doc.querySelector("parsererror")) {
     // try again with html parser if it fails as XML due to namespace errors
     doc = parser.parseFromString(content, "text/html");
  }

  const allElements = doc.querySelectorAll("*");
  for (const el of Array.from(allElements)) {
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "foreignobject") {
      el.remove();
      continue;
    }

    if (tag === "use") {
      let hasBadHref = false;
      for (const attr of Array.from(el.attributes)) {
        if (HREF_NAME.test(attr.name) || XLINK_HREF_NAME.test(attr.name)) {
          if (!normalizeUrl(attr.value).startsWith("#")) {
            hasBadHref = true;
          }
        }
      }
      if (hasBadHref) {
        el.remove();
        continue;
      }
    }

    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
      } else if (HREF_NAME.test(attr.name) || XLINK_HREF_NAME.test(attr.name)) {
        if (isUnsafeHref(attr.value)) {
          el.removeAttribute(attr.name);
        }
      }
    }
  }

  const svgEl = doc.querySelector("svg");
  if (!svgEl) {
    // If we couldn't parse an SVG root tag, return a safe fallback or the body's cleaned content.
    // In normal cases for this script, we expect to sanitize SVG inputs.
    return doc.body ? doc.body.innerHTML : "";
  }

  return svgEl.outerHTML;
}
