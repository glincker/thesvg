/** Flags ship in their own package, so flag results point there rather than at the generic icon packages. */
const pascal = (code: string): string => code.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

export function flagHint(slugs: readonly string[]): string | undefined {
  const slug = slugs.find((s) => s.startsWith("flag-"));
  if (!slug) return undefined;
  const code = slug.slice("flag-".length);
  return `Flags install from their own package: pnpm add @thesvg/flags, then import { Flag${pascal(code)} } from "@thesvg/flags/react/${code}"`;
}
