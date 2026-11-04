/**
 * Every drawing defines its own gradient and mask ids. When the same icon appears twice on a page the copies would share
 * them, and a gradient's currentColor resolves in the first copy, so a second copy in another color picks up the first
 * one's color. This gives one rendered copy its own ids by adding a suffix to each definition and every reference.
 */
export function scopeIds(svg: string, uid: string): string {
  // ⚡ Bolt: Use a single-pass loop instead of `new Set(array.map(...))` to
  // prevent intermediate array allocations and reduce GC pressure.
  const safe: string[] = [];
  const seen = new Set<string>();
  for (const match of svg.matchAll(/\bid="([^"]+)"/g)) {
    const id = match[1];
    if (!seen.has(id)) {
      seen.add(id);
      if (/^[\w-]+$/.test(id)) {
        safe.push(id);
      }
    }
  }
  if (safe.length === 0) return svg;
  const pattern = new RegExp(`(id="|url\\(#|href="#)(${safe.join("|")})(?=["\\)])`, "g");
  return svg.replace(pattern, `$1$2-${uid}`);
}
