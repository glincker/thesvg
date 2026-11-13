/** Flags ship in their own package, so any flag result points there rather than at the generic icon packages. */
const pascal = (code: string): string => code.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

export function flagCode(slug: string): string | undefined {
  return slug.startsWith("flag-") ? slug.slice("flag-".length) : undefined;
}

/** Lines to append to a tool answer when any slug is a flag; empty otherwise. */
export function flagHintLines(slugs: readonly string[]): string[] {
  const code = slugs.map(flagCode).find((c): c is string => Boolean(c));
  if (!code) return [];
  return [
    "",
    "Flags install from their own package, not @thesvg/icons:",
    "```bash",
    "pnpm add @thesvg/flags",
    "```",
    "```tsx",
    `import { Flag${pascal(code)} } from "@thesvg/flags/react/${code}";`,
    "```",
  ];
}
