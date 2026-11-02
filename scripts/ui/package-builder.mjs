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
  `${esm
    .replace(/^import \{([^}]*)\} from ("[^"]+");$/gm, "const {$1} = require($2);")
    .replace('"./_scope.js"', '"./_scope.cjs"')
    .replace('"./_anim.js"', '"./_anim.cjs"')
    .replace("export const make =", "const make =")}module.exports = { make };\n`;

// Every icon defines its own gradient and mask ids. Two copies of one icon on a page would share them, and a gradient's
// currentColor then resolves in the first copy, so a second icon in another color would pick up the first one's color.
// Each rendered instance gets its own suffix instead. nextId is for frameworks with no built-in instance id.
// Ids here are plain words and dashes (checked below), so they need no regex escaping.
const SCOPE_JS = String.raw`export const scoper = (ids) => {
  if (ids.length === 0) return (html) => html;
  const re = new RegExp('(id="|url\\(#|href="#)(' + ids.join("|") + ')(?=["\\)])', "g");
  return (html, uid) => html.replace(re, "$1$2-" + uid);
};
let n = 0;
export const nextId = () => ++n;
`;
export const LIFT_JS = `export const lift = (shadow, size) => {
  const a = shadow === true ? 0.3 : Number(shadow) || 0;
  if (a <= 0) return undefined;
  const k = (Number(size) || 24) / 24;
  return "drop-shadow(0 " + (k).toFixed(2) + "px " + (k * 1.8).toFixed(2) + "px color-mix(in srgb, currentColor " + Math.round(Math.min(1, a) * 100) + "%, transparent))";
};
`;
const ANIM_SRC = readFileSync(new URL("./anim-runtime.mjs", import.meta.url), "utf8");
const ANIM_CJS = `${ANIM_SRC.replace(/^export const (\w+) =/gm, "const $1 =")}module.exports = { animate, animateSvg, ANIMATED, ANIMATED_SLUGS, PRESETS };\n`;
const ANIM_DTS = `export declare const animate: (html: string, uid: string | number, kind?: string | boolean) => { cls: string; html: string };\nexport declare const animateSvg: (svg: string, kind?: string) => string;\nexport declare const ANIMATED_SLUGS: string[];\nexport declare const ANIMATED: Record<string, string>;\nexport declare const PRESETS: string[];\n`;
const SCOPE_DTS = `export declare const scoper: (ids: string[]) => (html: string, uid: string | number) => string;\nexport declare const nextId: () => number;\n`;
const idsOf = (svg) => {
  const ids = [...new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))];
  for (const id of ids) if (!/^[\w-]+$/.test(id)) throw new Error(`svg id "${id}" has characters the scoper does not escape`);
  return ids;
};

/**
 * Packages with one JS module per icon: a shared factory file plus one file per icon that calls it once per look.
 * profile: { name, factory (ESM source exporting make(markup, name)), factoryDts, iconDtsImport, barrelDtsExtra, markup: "inner" | "full" }
 */
export function buildJsPackage(pkgDir, profile) {
  const manifest = loadManifest();
  const dist = join(pkgDir, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, "_scope.js"), SCOPE_JS);
  writeFileSync(join(dist, "_scope.cjs"), `${SCOPE_JS.replace(/^export const (\w+) =/gm, "const $1 =")}module.exports = { scoper, nextId };\n`);
  writeFileSync(join(dist, "_scope.d.ts"), SCOPE_DTS);
  writeFileSync(join(dist, "_anim.js"), ANIM_SRC);
  writeFileSync(join(dist, "_anim.cjs"), ANIM_CJS);
  writeFileSync(join(dist, "_anim.d.ts"), ANIM_DTS);
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
      const ids = JSON.stringify(idsOf(svg));
      const name = exportName(icon.slug, look);
      names.push(name);
      esm += `export const ${name} = /* @__PURE__ */ make(${markup}, ${JSON.stringify(name)}, ${ids});\n`;
      cjs += `exports.${name} = make(${markup}, ${JSON.stringify(name)}, ${ids});\n`;
      dts += `export declare const ${name}: UiIcon;\n`;
    }
    writeFileSync(join(dist, `${icon.slug}.js`), esm);
    writeFileSync(join(dist, `${icon.slug}.cjs`), cjs);
    writeFileSync(join(dist, `${icon.slug}.d.ts`), dts);
    esmBarrel.push(`export { ${names.join(", ")} } from "./${icon.slug}.js";`);
    cjsBarrel.push(`Object.assign(exports, require("./${icon.slug}.cjs"));`);
    dtsBarrel.push(`export { ${names.join(", ")} } from "./${icon.slug}.js";`);
  }
  // Hand written components that are not one per icon (the theme switcher icon), exported next to the icons.
  for (const x of profile.extras ?? []) {
    writeFileSync(join(dist, `${x.file}.js`), x.esm);
    writeFileSync(join(dist, `${x.file}.cjs`), x.cjs);
    writeFileSync(join(dist, `${x.file}.d.ts`), x.dts);
    esmBarrel.push(`export { ${x.names.join(", ")} } from "./${x.file}.js";`);
    cjsBarrel.push(`Object.assign(exports, require("./${x.file}.cjs"));`);
    dtsBarrel.push(`export { ${x.names.join(", ")} } from "./${x.file}.js";`);
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
  writeFileSync(join(dist, "_scope.js"), SCOPE_JS);
  writeFileSync(join(dist, "_scope.d.ts"), SCOPE_DTS);
  writeFileSync(join(dist, "_anim.js"), ANIM_SRC);
  writeFileSync(join(dist, "_anim.d.ts"), ANIM_DTS);
  writeFileSync(join(dist, "_lift.js"), LIFT_JS);
  writeFileSync(join(dist, "_lift.d.ts"), `export declare const lift: (shadow: boolean | number, size: number | string) => string | undefined;\n`);
  for (const icon of manifest.icons) {
    for (const look of manifest.looks) {
      const base = look === "outline" ? icon.slug : `${icon.slug}-${look}`;
      const svg = readSvg(icon.slug, look);
      const html = JSON.stringify(inner(svg));
      const ids = JSON.stringify(idsOf(svg));
      writeFileSync(join(dist, `${base}.svelte`), `<script>\n  import { scoper, nextId } from "./_scope.js";\n  import { lift } from "./_lift.js";\n  import { animate } from "./_anim.js";\n  export let size = 24;\n  export let shadow = 0;\n  export let animated = false;\n  $: filter = lift(shadow, size);\n  const html = ${html};\n  const ids = ${ids};\n  const uid = nextId();\n  $: markup = animated ? scoper(ids)(animate(html, uid, animated).html, uid) : scoper(ids)(html, uid);\n</script>\n\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} overflow="visible" style={filter ? "filter:" + filter : undefined} aria-hidden={$$restProps["aria-label"] ? undefined : "true"} {...$$restProps}>{@html markup}</svg>\n`);
      writeFileSync(join(dist, `${base}.svelte.d.ts`), `import type { SvelteComponent } from "svelte";\nimport type { SVGAttributes } from "svelte/elements";\n\nexport default class ${exportName(icon.slug, look)} extends SvelteComponent<SVGAttributes<SVGSVGElement> & { size?: number | string; shadow?: boolean | number; /** Motion: true or "draw" pops in and draws the strokes once. Also pop, bounce, ring (once) and spin, pulse (forever). */ animated?: boolean | "draw" | "pop" | "bounce" | "ring" | "spin" | "pulse" }> {}\n`);
      barrel.push(`export { default as ${exportName(icon.slug, look)} } from "./${base}.svelte";`);
    }
  }
  writeFileSync(join(dist, "index.js"), `${barrel.join("\n")}\n`);
  writeFileSync(join(dist, "index.d.ts"), `${barrel.join("\n")}\n`);
  console.log(`built ${name}: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
}
