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
  for (const [key, publicPath] of Object.entries(icon.variants)) {
    // Anything else (traversal, other file types) could inline files from
    // outside the icon set into the published package.
    const content = publicPath && ICON_PATH.test(publicPath) ? read(publicPath) : "";
    if (content) variants[key] = content;
  }

  const keys = [...PRIMARY_ORDER.filter((key) => key in icon.variants), ...Object.keys(icon.variants)];
  const primary = keys.map((key) => variants[key]).find(Boolean) ?? "";

  return { variants, primary };
}
