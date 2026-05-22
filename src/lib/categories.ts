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
