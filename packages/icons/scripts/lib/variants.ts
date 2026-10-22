/**
 * Resolve the SVG content of an icon's variants.
 *
 * Kept free of filesystem access (the caller passes a reader) so the
 * resolution rules can be unit-tested against a fake file tree.
 */

import type { RawIcon } from "./codegen.ts";

/**
 * Returns the trimmed SVG at a public path such as "/icons/github/default.svg",
 * or "" when there is no file there.
 */
export type SvgReader = (publicPath: string) => string;

/** The only shape of path the build will read: /icons/<folder>/<file>.svg. */
const ICON_PATH = /^\/icons\/(?!\.\.?\/)[\w.-]+\/(?!\.\.?\/)[\w.-]+\.svg$/;

/** Variants tried first when picking the SVG exported as `svg`. */
const PRIMARY_ORDER = ["default", "color", "mono", "light", "dark", "wordmark"];

/**
 * Read `publicPath` with `read`, or return "" when it is missing or not an
 * /icons/<folder>/<file>.svg path. Anything else (traversal, other file
 * types) could inline files from outside the icon set into a package.
 */
export function readIconSvg(publicPath: string | undefined, read: SvgReader): string {
  return publicPath && ICON_PATH.test(publicPath) ? read(publicPath) : "";
}

/**
 * The SVG a package exports as an icon's main artwork: the first of
 * default, color, mono, light, dark and wordmark that has a file, then any
 * other variant in icons.json order. "" when no variant has a file.
 */
export function primarySvg(variants: Readonly<Record<string, string | undefined>>, read: SvgReader): string {
  const keys = [...PRIMARY_ORDER.filter((key) => key in variants), ...Object.keys(variants)];
  for (const key of keys) {
    const svg = readIconSvg(variants[key], read);
    if (svg) return svg;
  }
  return "";
}

export interface ResolvedSvgs {
  /** Every variant that has SVG content, keyed like icons.json. */
  variants: Record<string, string>;
  /** The SVG exported as `svg`, or "" when the icon has no SVG at all. */
  primary: string;
}

/**
 * Read every variant of `icon` and pick its primary SVG.
 *
 * Each file comes from the variant's icons.json path. File names are not
 * always the key (wordmarkLight -> wordmark-light.svg, default ->
 * color.svg, or a dated folder), so rebuilding them from the key drops
 * those variants.
 */
export function resolveSvgs(icon: Pick<RawIcon, "variants">, read: SvgReader): ResolvedSvgs {
  const variants: Record<string, string> = {};
  const byPath = new Map<string, string>();
  for (const [key, publicPath] of Object.entries(icon.variants)) {
    const content = readIconSvg(publicPath, read);
    if (!content || !publicPath) continue;
    variants[key] = content;
    byPath.set(publicPath, content);
  }
  // Pick from what was already read instead of reading the files again.
  const primary = primarySvg(icon.variants, (publicPath) => byPath.get(publicPath) ?? "");
  return { variants, primary };
}
