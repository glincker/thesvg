// Same layout as the React package. React Native has no currentColor, so every component takes a `color` prop
// and swaps it into the SVG text before handing it to react-native-svg.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const dist = resolve(here, "../dist");
const manifest = JSON.parse(readFileSync(join(root, "src/data/ui-icons.json"), "utf8"));
const pascal = (slug) => slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
const exportName = (slug, look) => `${/^[0-9]/.test(slug) ? "I" : ""}${pascal(slug)}${look === "outline" ? "" : pascal(look)}Icon`;

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const MAKE_ESM = `import { createElement } from "react";
import { SvgXml } from "react-native-svg";
export const make = (xml, name) => {
  const Icon = ({ size = 24, color = "#000000", ...props }) =>
    createElement(SvgXml, { xml: xml.split("currentColor").join(color), width: size, height: size, ...props });
  Icon.displayName = name;
  return Icon;
};
`;
writeFileSync(join(dist, "_make.js"), MAKE_ESM);
writeFileSync(join(dist, "_make.cjs"), MAKE_ESM.replace('import { createElement } from "react";', 'const { createElement } = require("react");').replace('import { SvgXml } from "react-native-svg";', 'const { SvgXml } = require("react-native-svg");').replace("export const make =", "const make =") + "module.exports = { make };\n");
writeFileSync(join(dist, "_make.d.ts"), `import type { FunctionComponent } from "react";
import type { SvgProps } from "react-native-svg";
export interface UiIconProps extends Omit<SvgProps, "width" | "height" | "color"> { size?: number | string; color?: string }
export type UiIcon = FunctionComponent<UiIconProps>;
export declare const make: (xml: string, name: string) => UiIcon;
`);

const be = [], bc = [], bd = [];
for (const icon of manifest.icons) {
  let esm = `import { make } from "./_make.js";\n`;
  let cjs = `"use strict";\nconst { make } = require("./_make.cjs");\n`;
  let dts = `import type { UiIcon } from "./_make.js";\n`;
  const names = [];
  for (const look of manifest.looks) {
    const xml = readFileSync(join(root, "public/ui", icon.slug, `${look}.svg`), "utf8").trim();
    const name = exportName(icon.slug, look);
    names.push(name);
    esm += `export const ${name} = /* @__PURE__ */ make(${JSON.stringify(xml)}, ${JSON.stringify(name)});\n`;
    cjs += `exports.${name} = make(${JSON.stringify(xml)}, ${JSON.stringify(name)});\n`;
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
writeFileSync(join(dist, "index.d.ts"), `export type { UiIcon, UiIconProps } from "./_make.js";\n${bd.join("\n")}\n`);
console.log(`built @thesvg/ui-react-native: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
