/**
 * Pure URL/href safety helpers shared by the app SVG upload validator and the
 * icon enrichment scripts. No DOM or Node APIs, so it runs anywhere.
 */

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
export function normalizeUrl(raw: string): string {
  let value = raw;
  for (let i = 0; i < 4; i++) {
    const next = decodeEntitiesOnce(value);
    if (next === value) break;
    value = next;
  }
  return value.replace(/[\s\u0000-\u001f\u007f]/g, "").toLowerCase();
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
