/**
 * Static audit rules for SVG icon sources (public/icons).
 *
 * Icons are static assets audited at ingest, not sanitized at render time.
 * A file is a violation when any explicit rule matches or when running
 * sanitizeSvg over it would change the content.
 */

import { isUnsafeHref, sanitizeSvg } from "./sanitize-svg";

export interface SvgFinding {
  rule: string;
  message: string;
}

const TAG_RE = /<([a-zA-Z][^\s/>]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
const ATTR_RE = /([^\s=/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const HREF_NAME = /^(?:[a-z][a-z0-9]*:)?href$/i;

function readAttrs(attrSource: string): Array<{ name: string; value: string }> {
  const attrs: Array<{ name: string; value: string }> = [];
  for (const m of attrSource.matchAll(ATTR_RE)) {
    attrs.push({ name: m[1], value: m[2] ?? m[3] ?? m[4] ?? "" });
  }
  return attrs;
}

function squash(value: string): string {
  return value.replace(/[\s\u0000-\u001f\u007f]/g, "").toLowerCase();
}

export function auditSvg(content: string): SvgFinding[] {
  const findings: SvgFinding[] = [];
  const seen = new Set<string>();
  const add = (rule: string, message: string): void => {
    if (seen.has(rule)) return;
    seen.add(rule);
    findings.push({ rule, message });
  };

  if (/<\s*script[\s>/]/i.test(content)) add("script-tag", "<script> element");
  if (/<\s*foreignObject[\s>/]/i.test(content)) add("foreign-object", "<foreignObject> element");

  for (const tag of content.matchAll(TAG_RE)) {
    const name = tag[1].toLowerCase();
    for (const attr of readAttrs(tag[2])) {
      if (/^on/i.test(attr.name)) add("event-handler", `event handler attribute ${attr.name}`);
      if (!HREF_NAME.test(attr.name)) continue;
      const v = squash(attr.value);
      if (name === "use" && !v.startsWith("#")) {
        add("use-external-href", "<use> with a non-fragment href");
      }
      if (v.startsWith("//")) add("protocol-relative-href", "protocol-relative //host href");
      if (v.startsWith("javascript:") || v.startsWith("vbscript:")) {
        add("script-uri", "javascript: or vbscript: URI");
      } else if (v.startsWith("data:image/")) {
        if (/^data:image\/svg\+xml/.test(v)) add("data-svg-href", "data:image/svg+xml href");
        else add("embedded-raster", "embedded raster data: href");
      } else if (v.startsWith("data:")) {
        add("data-href", "non-raster data: href");
      } else if (isUnsafeHref(attr.value)) {
        add("unsafe-href", "unsafe href value");
      }
    }
  }

  if (findings.length === 0 && sanitizeSvg(content) !== content) {
    add("sanitizer-diff", "sanitizeSvg would modify this file");
  }
  return findings;
}
