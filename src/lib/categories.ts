/**
 * Shared helpers for the category surface. Owned in one place so the
 * sitemap and the /category/[slug] route can never drift on slug shape.
 */

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

/**
 * Categories that ship a custom landing page (not just the generic
 * HomeContent grid). When a category click would normally route to
 * `/?category=<name>`, send it to the dedicated page instead — gives
 * a coherent UX and keeps the landing as the canonical URL for SEO.
 */
const CATEGORIES_WITH_LANDING = new Set<string>([
  "Google 2026",
]);

/**
 * Returns the canonical URL for browsing a category. Use this instead
 * of hand-building `/?category=...` links so that any category with a
 * dedicated landing page is honored automatically.
 */
export function categoryUrl(name: string): string {
  if (CATEGORIES_WITH_LANDING.has(name)) {
    return `/category/${slugifyCategory(name)}`;
  }
  return `/?category=${encodeURIComponent(name)}`;
}

export function hasCategoryLanding(name: string): boolean {
  return CATEGORIES_WITH_LANDING.has(name);
}
