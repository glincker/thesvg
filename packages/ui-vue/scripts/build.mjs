// Same layout as the React package: one file per icon, one named export per look, markup rendered through innerHTML.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const dist = resolve(here, "../dist");
const manifest = JSON.parse(readFileSync(join(root, "src/data/ui-icons.json"), "utf8"));
const pascal = (slug) => slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
const exportName = (slug, look) => `${/^[0-9]/.test(slug) ? "I" : ""}${pascal(slug)}${look === "outline" ? "" : pascal(look)}Icon`;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const MAKE_ESM = `import { defineComponent, h } from "vue";
export const make = (html, name) => defineComponent({
  name,
  props: { size: { type: [Number, String], default: 24 } },
  setup(props, { attrs }) {
    return () => h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: props.size, height: props.size, overflow: "visible", "aria-hidden": attrs["aria-label"] ? undefined : "true", innerHTML: html });
  },
});
`;
writeFileSync(join(dist, "_make.js"), MAKE_ESM);
writeFileSync(join(dist, "_make.cjs"), MAKE_ESM.replace('import { defineComponent, h } from "vue";', 'const { defineComponent, h } = require("vue");').replace("export const make =", "const make =") + "module.exports = { make };\n");
writeFileSync(join(dist, "_make.d.ts"), `import type { DefineComponent } from "vue";\nexport type UiIcon = DefineComponent<{ size?: number | string }>;\nexport declare const make: (html: string, name: string) => UiIcon;\n`);

const be = [], bc = [], bd = [];
for (const icon of manifest.icons) {
  let esm = `import { make } from "./_make.js";\n`;
  let cjs = `"use strict";\nconst { make } = require("./_make.cjs");\n`;
  let dts = `import type { UiIcon } from "./_make.js";\n`;
  const names = [];
  for (const look of manifest.looks) {
    const html = inner(readFileSync(join(root, "public/ui", icon.slug, `${look}.svg`), "utf8"));
    const name = exportName(icon.slug, look);
    names.push(name);
    esm += `export const ${name} = /* @__PURE__ */ make(${JSON.stringify(html)}, ${JSON.stringify(name)});\n`;
    cjs += `exports.${name} = make(${JSON.stringify(html)}, ${JSON.stringify(name)});\n`;
    dts += `export declare const ${name}: UiIcon;\n`;
  }
  writeFileSync(join(dist, `${icon.slug}.js`), esm);
  writeFileSync(join(dist, `${icon.slug}.cjs`), cjs);
  writeFileSync(join(dist, `${icon.slug}.d.ts`), dts);
  be.push(`export { ${names.join(", ")} } from "./${icon.slug}.js";`);
  bc.push(`Object.assign(exports, require("./${icon.slug}.cjs"));`);
  bd.push(`export { ${names.join(", ")} } from "./${icon.slug}.js";`);
}
writeFileSync(join(dist, "index.js"), be.join("\n") + "\n");
writeFileSync(join(dist, "index.cjs"), `"use strict";\n${bc.join("\n")}\n`);
writeFileSync(join(dist, "index.d.ts"), `export type { UiIcon } from "./_make.js";\n${bd.join("\n")}\n`);
console.log(`built @thesvg/ui-vue: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
