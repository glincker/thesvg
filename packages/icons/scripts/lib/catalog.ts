/**
 * Which catalog entries a generic package (@thesvg/icons, react, vue, svelte, solid, preact,
 * react-native, astro, static) builds. Specialty collections ship in their own package
 * (flags in @thesvg/flags), so every builder filters through here instead of ad hoc checks.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Collections left out of the generic packages. Source of truth: excluded-collections.json. */
export const EXCLUDED_COLLECTIONS: readonly string[] = (
  JSON.parse(readFileSync(join(here, "excluded-collections.json"), "utf8")) as { excluded: string[] }
).excluded;

export function isPackaged(icon: object): boolean {
  return !EXCLUDED_COLLECTIONS.includes((icon as { collection?: string }).collection ?? "");
}

/** The entries a generic package builds: the catalog minus the excluded collections. */
export function filterPackaged<T extends object>(icons: readonly T[]): T[] {
  return icons.filter(isPackaged);
}
