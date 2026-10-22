/**
 * Brand refreshes ship as separate icons (gmail and gmail-2026). A family
 * page should show the current mark, not both, so older versions are
 * dropped whenever a newer sibling is in the same list. Both stay
 * reachable on their own icon pages.
 */
interface Versioned {
  slug: string;
  supersedes?: string;
  supersededBy?: string;
}

const YEAR_SUFFIX = /^(.+)-(\d{4})$/;

/** Slugs in `icons` that have a newer version also in `icons`. */
export function supersededSlugs<T extends Versioned>(icons: T[]): Set<string> {
  // ⚡ Bolt: Use a single-pass loop instead of `new Set(array.map(...))` to
  // avoid allocating intermediate arrays and reduce garbage collection pressure.
  const present = new Set<string>();
  for (const i of icons) {
    present.add(i.slug);
  }
  const old = new Set<string>();
  for (const icon of icons) {
    if (icon.supersedes && present.has(icon.supersedes))
      old.add(icon.supersedes);
    if (icon.supersededBy && present.has(icon.supersededBy)) old.add(icon.slug);
    const m = YEAR_SUFFIX.exec(icon.slug);
    if (m && present.has(m[1])) old.add(m[1]);
  }
  return old;
}

/** `icons` without anything a newer sibling replaces. */
export function currentOnly<T extends Versioned>(icons: T[]): T[] {
  const old = supersededSlugs(icons);
  return old.size === 0 ? icons : icons.filter((i) => !old.has(i.slug));
}

/**
 * The slug to show for a flagship: its year-suffixed refresh when one
 * exists (gmail becomes gmail-2026), otherwise the slug itself.
 */
export function preferCurrentSlug(
  slug: string,
  has: (s: string) => boolean,
): string {
  const refreshed = `${slug}-2026`;
  return has(refreshed) ? refreshed : slug;
}
