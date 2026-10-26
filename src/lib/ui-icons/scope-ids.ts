/**
 * Every drawing defines its own gradient and mask ids. When the same icon appears twice on a page the copies would share
 * them, and a gradient's currentColor resolves in the first copy, so a second copy in another color picks up the first
 * one's color. This gives one rendered copy its own ids by adding a suffix to each definition and every reference.
 */
export function scopeIds(svg: string, uid: string): string {
  const ids = [...new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))];
  if (ids.length === 0) return svg;
  // Ids are plain words and dashes, so they need no escaping. Anything else is left alone rather than guessed at.
  const safe = ids.filter((id) => /^[\w-]+$/.test(id));
  if (safe.length === 0) return svg;
  const pattern = new RegExp(`(id="|url\\(#|href="#)(${safe.join("|")})(?=["\\)])`, "g");
  return svg.replace(pattern, `$1$2-${uid}`);
}
