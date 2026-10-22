/**
 * Filesystem-backed SvgReader for the package build scripts. The icons,
 * react, react-native, vue and svelte builders all read icon SVGs from the
 * monorepo's public/ directory through this one function.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { SvgReader } from "./variants.ts";

/** Read SVGs by their icons.json path from `publicDir` (the repo's public/). */
export function publicSvgReader(publicDir: string): SvgReader {
  return (publicPath) => {
    const file = join(publicDir, publicPath.replace(/^\//, ""));
    return existsSync(file) ? readFileSync(file, "utf8").trim() : "";
  };
}
