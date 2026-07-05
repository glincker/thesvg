import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

export type OutputFormat = "svg" | "jsx" | "vue";

export interface WriteIconOptions {
  dir: string;
  format: OutputFormat;
  slug: string;
  variant?: string;
}

export interface WriteResult {
  filePath: string;
  format: OutputFormat;
}

/**
 * Convert raw SVG markup to JSX-compatible markup (React).
 * Mirrors the logic in src/lib/copy-formats.ts on the web.
 */
function svgToJsx(svg: string): string {
  return svg
    .replace(/class=/g, "className=")
    .replace(/clip-path=/g, "clipPath=")
    .replace(/fill-rule=/g, "fillRule=")
    .replace(/clip-rule=/g, "clipRule=")
    .replace(/fill-opacity=/g, "fillOpacity=")
    .replace(/stroke-width=/g, "strokeWidth=")
    .replace(/stroke-linecap=/g, "strokeLinecap=")
    .replace(/stroke-linejoin=/g, "strokeLinejoin=")
    .replace(/stop-color=/g, "stopColor=")
    .replace(/stop-opacity=/g, "stopOpacity=")
    .replace(/gradient-units=/g, "gradientUnits=")
    .replace(/gradient-transform=/g, "gradientTransform=")
    .replace(/xmlns="[^"]*"\s?/g, "");
}

/**
 * Derive a PascalCase component name from a slug + variant.
 * E.g. "github" + "default" -> "GithubIcon"
 * E.g. "github" + "wordmarkDark" -> "GithubWordmarkDarkIcon"
 */
function toComponentName(slug: string, variant: string): string {
  const base = slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  if (variant === "default") {
    return `${base}Icon`;
  }

  const variantPart = variant.charAt(0).toUpperCase() + variant.slice(1);
  return `${base}${variantPart}Icon`;
}

/**
 * Wrap JSX in a full React functional component file.
 */
function wrapJsxComponent(jsxSvg: string, componentName: string): string {
  return [
    `import type { SVGProps } from "react";`,
    ``,
    `export function ${componentName}(props: SVGProps<SVGSVGElement>) {`,
    `  return (`,
    `    ${jsxSvg.replace(/\n/g, "\n    ")}`,
    `  );`,
    `}`,
    ``,
    `export default ${componentName};`,
  ].join("\n");
}

/**
 * Wrap SVG in a Vue SFC template block.
 */
function svgToVue(svg: string): string {
  return `<template>\n  ${svg}\n</template>\n`;
}

/**
 * Determine the output filename from slug + variant + format.
 */
function buildFileName(
  slug: string,
  variant: string,
  format: OutputFormat
): string {
  const variantSuffix =
    variant === "default"
      ? ""
      : `-${variant.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;

  switch (format) {
    case "jsx":
      return `${slug}${variantSuffix}.tsx`;
    case "vue":
      return `${slug}${variantSuffix}.vue`;
    default:
      return `${slug}${variantSuffix}.svg`;
  }
}

/**
 * Ensure directory exists, creating it recursively if needed.
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Write an SVG icon to disk in the requested format.
 */
export async function writeIcon(
  svgContent: string,
  options: WriteIconOptions
): Promise<WriteResult> {
  const { dir, format, slug, variant = "default" } = options;
  const resolvedDir = resolve(process.cwd(), dir);

  await ensureDir(resolvedDir);

  const fileName = buildFileName(slug, variant, format);
  const filePath = join(resolvedDir, fileName);

  let fileContent: string;

  switch (format) {
    case "jsx": {
      const jsxSvg = svgToJsx(svgContent);
      const componentName = toComponentName(slug, variant);
      fileContent = wrapJsxComponent(jsxSvg, componentName);
      break;
    }
    case "vue": {
      fileContent = svgToVue(svgContent);
      break;
    }
    default: {
      fileContent = svgContent;
      break;
    }
  }

  await writeFile(filePath, fileContent, "utf-8");

  return { filePath, format };
}

/**
 * Detect a sensible default output directory based on cwd structure.
 * Prefers ./public/icons if public/ exists (Next.js / Vite),
 * falls back to ./src/icons, then ./icons.
 */
export function detectDefaultDir(): string {
  const cwd = process.cwd();

  if (existsSync(join(cwd, "public"))) {
    return "./public/icons";
  }

  if (existsSync(join(cwd, "src"))) {
    return "./src/icons";
  }

  return "./icons";
}

/**
 * Return a display-friendly relative path anchored from cwd.
 */
export function relativeToCwd(absPath: string): string {
  const cwd = process.cwd();
  const rel = absPath.startsWith(cwd) ? absPath.slice(cwd.length) : absPath;
  return rel.startsWith("/") ? `.${rel}` : rel;
}
