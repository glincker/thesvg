// Shared by @thesvg/ui-react, -vue, -svelte and -react-native. Each package only supplies a small profile
// (how one component is made and typed); file layout, naming, CJS output, barrels and checks live here.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

export const pascal = (slug) => slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
/** Outline is the plain name (BellIcon), every other look adds its name (BellGlassIcon). */
export const exportName = (slug, look) => `${/^[0-9]/.test(slug) ? "I" : ""}${pascal(slug)}${look === "outline" ? "" : pascal(look)}Icon`;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();

export function loadManifest() {
  return JSON.parse(readFileSync(join(ROOT, "src/data/ui-icons.json"), "utf8"));
}
const lookCache = new Map();
/** Full SVG text for one icon in one look, read from the committed look files. */
export function readSvg(slug, look) {
  if (!lookCache.has(look)) lookCache.set(look, JSON.parse(readFileSync(join(ROOT, "src/data/ui/looks", `${look}.json`), "utf8")));
  const svg = lookCache.get(look)[slug];
  if (!svg) throw new Error(`no ${look} look for ${slug}`);
  return svg.trim();
}

/** `import { a } from "x"` becomes `const { a } = require("x")`, which is all the small factories need. */
const toCjs = (esm) =>
  `${esm.replace(/^import \{([^}]*)\} from ("[^"]+");$/gm, "const {$1} = require($2);").replace("export const make =", "const make =")}module.exports = { make };\n`;

/**
 * Packages with one JS module per icon: a shared factory file plus one file per icon that calls it once per look.
 * profile: { name, factory (ESM source exporting make(markup, name)), factoryDts, iconDtsImport, barrelDtsExtra, markup: "inner" | "full" }
 */
export function buildJsPackage(pkgDir, profile) {
  const manifest = loadManifest();
  const dist = join(pkgDir, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, "_make.js"), profile.factory);
  writeFileSync(join(dist, "_make.cjs"), toCjs(profile.factory));
  writeFileSync(join(dist, "_make.d.ts"), profile.factoryDts);

  const esmBarrel = [];
  const cjsBarrel = [];
  const dtsBarrel = [];
  for (const icon of manifest.icons) {
    let esm = `import { make } from "./_make.js";\n`;
    let cjs = `"use strict";\nconst { make } = require("./_make.cjs");\n`;
    let dts = `${profile.iconDtsImport}\n`;
    const names = [];
    for (const look of manifest.looks) {
      const svg = readSvg(icon.slug, look);
      const markup = JSON.stringify(profile.markup === "inner" ? inner(svg) : svg);
      const name = exportName(icon.slug, look);
      names.push(name);
      esm += `export const ${name} = /* @__PURE__ */ make(${markup}, ${JSON.stringify(name)});\n`;
      cjs += `exports.${name} = make(${markup}, ${JSON.stringify(name)});\n`;
      dts += `export declare const ${name}: UiIcon;\n`;
    }
    writeFileSync(join(dist, `${icon.slug}.js`), esm);
    writeFileSync(join(dist, `${icon.slug}.cjs`), cjs);
    writeFileSync(join(dist, `${icon.slug}.d.ts`), dts);
    esmBarrel.push(`export { ${names.join(", ")} } from "./${icon.slug}.js";`);
    cjsBarrel.push(`Object.assign(exports, require("./${icon.slug}.cjs"));`);
    dtsBarrel.push(`export { ${names.join(", ")} } from "./${icon.slug}.js";`);
  }
  writeFileSync(join(dist, "index.js"), `${esmBarrel.join("\n")}\n`);
  writeFileSync(join(dist, "index.cjs"), `"use strict";\n${cjsBarrel.join("\n")}\n`);
  writeFileSync(join(dist, "index.d.ts"), `${profile.barrelDtsExtra}\n${dtsBarrel.join("\n")}\n`);
  console.log(`built ${profile.name}: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
}

/** Svelte needs real .svelte files: one per icon and look, outline keeps the plain file name. */
export function buildSveltePackage(pkgDir, name) {
  const manifest = loadManifest();
  const dist = join(pkgDir, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  const barrel = [];
  for (const icon of manifest.icons) {
    for (const look of manifest.looks) {
      const base = look === "outline" ? icon.slug : `${icon.slug}-${look}`;
      const html = JSON.stringify(inner(readSvg(icon.slug, look)));
      writeFileSync(join(dist, `${base}.svelte`), `<script>\n  export let size = 24;\n</script>\n\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} overflow="visible" aria-hidden={$$restProps["aria-label"] ? undefined : "true"} {...$$restProps}>{@html ${html}}</svg>\n`);
      writeFileSync(join(dist, `${base}.svelte.d.ts`), `import type { SvelteComponent } from "svelte";\nimport type { SVGAttributes } from "svelte/elements";\n\nexport default class ${exportName(icon.slug, look)} extends SvelteComponent<SVGAttributes<SVGSVGElement> & { size?: number | string }> {}\n`);
      barrel.push(`export { default as ${exportName(icon.slug, look)} } from "./${base}.svelte";`);
    }
  }
  writeFileSync(join(dist, "index.js"), `${barrel.join("\n")}\n`);
  writeFileSync(join(dist, "index.d.ts"), `${barrel.join("\n")}\n`);
  console.log(`built ${name}: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
}
