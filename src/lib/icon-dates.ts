/**
 * Descending comparator for ISO date strings (newest first). Plain
 * inequalities instead of localeCompare since dates are predictable
 * non-localized ASCII; missing dates sort last.
 *
 * Lives outside @/lib/icons, which loads the whole icons.json catalog, so
 * client components can import it without bundling the catalog.
 */
export function compareDateDesc(a?: string, b?: string): number {
  const dateA = a ?? "";
  const dateB = b ?? "";
  if (dateB < dateA) return -1;
  if (dateB > dateA) return 1;
  return 0;
}
