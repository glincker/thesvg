// Generates one file per icon with one named export per look: ShieldCheckIcon is outline, the rest add the look
// (ShieldCheckGlassIcon). Separate exports let bundlers drop looks nobody imports, which is where the size goes.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const dist = resolve(here, "../dist");
const manifest = JSON.parse(readFileSync(join(root, "src/data/ui-icons.json"), "utf8"));
const LOOKS = manifest.looks;

const pascal = (slug) => slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
const exportName = (slug, look) => `${/^[0-9]/.test(slug) ? "I" : ""}${pascal(slug)}${look === "outline" ? "" : pascal(look)}Icon`;
// Inner markup only: the component supplies the root so size, ref and props always apply.
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const SHARED_TYPES = `import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";
export interface UiIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> { size?: number | string }
export type UiIcon = ForwardRefExoticComponent<UiIconProps & RefAttributes<SVGSVGElement>>;
`;
writeFileSync(join(dist, "types.d.ts"), SHARED_TYPES);

// One tiny shared factory so each icon file holds only its markup.
const FACTORY_ESM = `import { createElement, forwardRef } from "react";
export const make = (html, name) => {
  const Icon = forwardRef(({ size = 24, ...props }, ref) =>
    createElement("svg", { ref, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: size, height: size, overflow: "visible", "aria-hidden": props["aria-label"] ? undefined : true, ...props, dangerouslySetInnerHTML: { __html: html } }));
  Icon.displayName = name;
  return Icon;
};
`;
writeFileSync(join(dist, "_make.js"), FACTORY_ESM);
writeFileSync(join(dist, "_make.cjs"), FACTORY_ESM.replace('import { createElement, forwardRef } from "react";', 'const { createElement, forwardRef } = require("react");').replace("export const make =", "const make =") + "module.exports = { make };\n");
writeFileSync(join(dist, "_make.d.ts"), `import type { UiIcon } from "./types.js";\nexport declare const make: (html: string, name: string) => UiIcon;\n`);

const barrelEsm = [];
const barrelCjs = [];
const barrelDts = [];
for (const icon of manifest.icons) {
  let esm = `import { make } from "./_make.js";\n`;
  let cjs = `"use strict";\nconst { make } = require("./_make.cjs");\n`;
  let dts = `import type { UiIcon } from "./types.js";\n`;
  const names = [];
  for (const look of LOOKS) {
    const html = inner(readFileSync(join(root, "public/ui", icon.slug, `${look}.svg`), "utf8")).trim();
    const name = exportName(icon.slug, look);
    names.push(name);
    esm += `export const ${name} = /* @__PURE__ */ make(${JSON.stringify(html)}, ${JSON.stringify(name)});\n`;
    cjs += `exports.${name} = make(${JSON.stringify(html)}, ${JSON.stringify(name)});\n`;
    dts += `export declare const ${name}: UiIcon;\n`;
  }
  writeFileSync(join(dist, `${icon.slug}.js`), esm);
  writeFileSync(join(dist, `${icon.slug}.cjs`), cjs);
  writeFileSync(join(dist, `${icon.slug}.d.ts`), dts);
  barrelEsm.push(`export { ${names.join(", ")} } from "./${icon.slug}.js";`);
  barrelCjs.push(`Object.assign(exports, require("./${icon.slug}.cjs"));`);
  barrelDts.push(`export { ${names.join(", ")} } from "./${icon.slug}.js";`);
}
writeFileSync(join(dist, "index.js"), barrelEsm.join("\n") + "\n");
writeFileSync(join(dist, "index.cjs"), `"use strict";\n${barrelCjs.join("\n")}\n`);
writeFileSync(join(dist, "index.d.ts"), `export type { UiIcon, UiIconProps } from "./types.js";\n${barrelDts.join("\n")}\n`);
console.log(`built @thesvg/ui-react: ${manifest.icons.length} icons x ${LOOKS.length} looks`);
