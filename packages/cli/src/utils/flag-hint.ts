/** Flags ship in their own package, so flag results point there rather than at the generic icon packages. */
const VALID_CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pascal = (code: string): string => code.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");

export function flagHint(slugs: readonly string[]): string | undefined {
  const slug = slugs.find((s) => s.startsWith("flag-") && VALID_CODE.test(s.slice("flag-".length)));
  if (!slug) return undefined;
  const code = slug.slice("flag-".length);
  return `Flags install from their own package: pnpm add @thesvg/flags, then import { Flag${pascal(code)} } from "@thesvg/flags/react/${code}"`;
}
