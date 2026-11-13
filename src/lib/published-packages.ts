/**
 * Packages that are on npm today. The icon page only offers an install tab for a package listed here, so it
 * never points visitors at something that returns a 404.
 */
export const PUBLISHED_PACKAGES: readonly string[] = ["@thesvg/react", "@thesvg/icons", "@thesvg/cli", "@thesvg/flags"];

export const isPackagePublished = (name: string): boolean => PUBLISHED_PACKAGES.includes(name);

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export const PACKAGE_MANAGERS: readonly PackageManager[] = ["npm", "pnpm", "yarn", "bun"];

const INSTALL: Record<PackageManager, string> = { npm: "npm install", pnpm: "pnpm add", yarn: "yarn add", bun: "bun add" };
export const installCommand = (pm: PackageManager, pkg: string): string => `${INSTALL[pm]} ${pkg}`;

/** The package an icon page recommends: flags have their own, everything else is in the React package. */
export function packageForSlug(slug: string): { name: string; importLine: string | null } {
  if (slug.startsWith("flag-")) {
    const code = slug.slice("flag-".length);
    const component = "Flag" + code.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
    return { name: "@thesvg/flags", importLine: `import { ${component} } from "@thesvg/flags/react/${code}";` };
  }
  return { name: "@thesvg/react", importLine: null };
}
