/** Copy-paste snippets for one flag. Components live in @thesvg/flags, never in the generic icon packages. */
const pascal = (code: string): string => code.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

export const componentName = (code: string): string => `Flag${pascal(code)}`;

export const reactImport = (code: string): string => `import { ${componentName(code)} } from "@thesvg/flags/react/${code}";`;

export const installLine = "pnpm add @thesvg/flags";

export const imgTag = (slug: string, name: string, variant: "default" | "square" | "circle", width: number, height: number): string =>
  `<img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/${slug}/${variant}.svg" alt="${name}" width="${width}" height="${height}" />`;

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
