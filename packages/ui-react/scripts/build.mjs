import { fileURLToPath } from "node:url";
import { buildJsPackage } from "../../../scripts/ui/package-builder.mjs";

buildJsPackage(fileURLToPath(new URL("..", import.meta.url)), {
  name: "@thesvg/ui-react",
  markup: "inner",
  factory: `import { createElement, forwardRef, useId } from "react";
import { scoper } from "./_scope.js";
import { animate } from "./_anim.js";
const liftOf = (shadow, size) => {
  const a = shadow === true ? 0.3 : Number(shadow) || 0;
  if (a <= 0) return undefined;
  const k = (Number(size) || 24) / 24;
  return "drop-shadow(0 " + (k).toFixed(2) + "px " + (k * 1.8).toFixed(2) + "px color-mix(in srgb, currentColor " + Math.round(Math.min(1, a) * 100) + "%, transparent))";
};
export const make = (html, name, ids) => {
  const scope = scoper(ids);
  const Icon = forwardRef(({ size = 24, shadow = 0, animated = false, style, ...props }, ref) => {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    return createElement("svg", { ref, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: size, height: size, overflow: "visible", style: liftOf(shadow, size) ? { ...style, filter: liftOf(shadow, size) } : style, "aria-hidden": props["aria-label"] ? undefined : true, ...props, dangerouslySetInnerHTML: { __html: scope(animated ? animate(html, uid, animated).html : html, uid) } });
  });
  Icon.displayName = name;
  return Icon;
};
`,
  factoryDts: `import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";
export interface UiIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> { size?: number | string; /** Lift shadow under the icon: true, or an opacity from 0 to 1. Works on every look. */ shadow?: boolean | number; /** Motion: true or \"draw\" pops in and draws the strokes once. Also pop, bounce, ring (once) and spin, pulse (forever). */ animated?: boolean | "draw" | "pop" | "bounce" | "ring" | "spin" | "pulse" }
export type UiIcon = ForwardRefExoticComponent<UiIconProps & RefAttributes<SVGSVGElement>>;
export declare const make: (html: string, name: string, ids: string[]) => UiIcon;
`,
  iconDtsImport: `import type { UiIcon } from "./_make.js";`,
  barrelDtsExtra: `export type { UiIcon, UiIconProps } from "./_make.js";\nexport type { ThemeIconProps } from "./theme-icon.js";\nexport type { IconSwapProps } from "./icon-swap.js";`,
  extras: [{ file: "theme-icon", names: ["ThemeIcon"], esm: "import { createElement } from \"react\";\nimport * as sun from \"./sun.js\";\nimport * as moon from \"./moon.js\";\nimport * as system from \"./theme-system.js\";\nconst LOOKS = { outline: \"\", glass: \"Glass\", duotone: \"Duotone\", offset: \"Offset\", fill: \"Fill\", \"glass-outline\": \"GlassOutline\", depth: \"Depth\" };\nconst PICK = { light: [sun, \"Sun\"], dark: [moon, \"Moon\"], system: [system, \"ThemeSystem\"] };\nexport const ThemeIcon = ({ theme = \"system\", look = \"outline\", animated = true, ...props }) => {\n  const [mod, base] = PICK[theme] || PICK.system;\n  return createElement(mod[base + (LOOKS[look] || \"\") + \"Icon\"], { animated, ...props });\n};\n", cjs: "\"use strict\";\nconst { createElement } = require(\"react\");\nconst sun = require(\"./sun.cjs\");\nconst moon = require(\"./moon.cjs\");\nconst system = require(\"./theme-system.cjs\");\nconst LOOKS = { outline: \"\", glass: \"Glass\", duotone: \"Duotone\", offset: \"Offset\", fill: \"Fill\", \"glass-outline\": \"GlassOutline\", depth: \"Depth\" };\nconst PICK = { light: [sun, \"Sun\"], dark: [moon, \"Moon\"], system: [system, \"ThemeSystem\"] };\nexports.ThemeIcon = ({ theme = \"system\", look = \"outline\", animated = true, ...props }) => {\n  const [mod, base] = PICK[theme] || PICK.system;\n  return createElement(mod[base + (LOOKS[look] || \"\") + \"Icon\"], { animated, ...props });\n};\n", dts: "import type { ReactElement } from \"react\";\nimport type { UiIconProps } from \"./_make.js\";\nexport interface ThemeIconProps extends UiIconProps {\n  /** Which theme the icon shows: sun for light, moon for dark, a display for system. */\n  theme?: \"light\" | \"dark\" | \"system\";\n  look?: \"outline\" | \"glass\" | \"duotone\" | \"offset\" | \"fill\" | \"glass-outline\" | \"depth\";\n  /** Plays the entrance motion each time the theme changes. On by default. */\n  animated?: boolean;\n}\nexport declare const ThemeIcon: (props: ThemeIconProps) => ReactElement;\n" }, { file: "icon-swap", names: ["IconSwap"], esm: "import { createElement } from \"react\";\nconst CSS = \".ui-swap{position:relative;display:inline-block}.ui-swap>svg{position:absolute;inset:0;transition:opacity .22s ease,transform .4s cubic-bezier(.34,1.56,.64,1)}.ui-swap>svg[data-on=false]{opacity:0;transform:rotate(90deg) scale(.3)}.ui-swap>svg[data-on=true]{opacity:1;transform:none}@media (prefers-reduced-motion:reduce){.ui-swap>svg{transition:none}}\";\nexport const IconSwap = ({ active = false, on: On, off: Off, size = 24, className, ...props }) =>\n  createElement(\"span\", { className: \"ui-swap\" + (className ? \" \" + className : \"\"), style: { width: size, height: size } },\n    createElement(\"style\", null, CSS),\n    createElement(Off, { ...props, size, \"data-on\": String(!active) }),\n    createElement(On, { ...props, size, \"data-on\": String(active) }));\n", cjs: "\"use strict\";\nconst { createElement } = require(\"react\");\nconst CSS = \".ui-swap{position:relative;display:inline-block}.ui-swap>svg{position:absolute;inset:0;transition:opacity .22s ease,transform .4s cubic-bezier(.34,1.56,.64,1)}.ui-swap>svg[data-on=false]{opacity:0;transform:rotate(90deg) scale(.3)}.ui-swap>svg[data-on=true]{opacity:1;transform:none}@media (prefers-reduced-motion:reduce){.ui-swap>svg{transition:none}}\";\nexports.IconSwap = ({ active = false, on: On, off: Off, size = 24, className, ...props }) =>\n  createElement(\"span\", { className: \"ui-swap\" + (className ? \" \" + className : \"\"), style: { width: size, height: size } },\n    createElement(\"style\", null, CSS),\n    createElement(Off, { ...props, size, \"data-on\": String(!active) }),\n    createElement(On, { ...props, size, \"data-on\": String(active) }));\n", dts: "import type { ReactElement } from \"react\";\nimport type { UiIcon, UiIconProps } from \"./_make.js\";\nexport interface IconSwapProps extends UiIconProps {\n  /** false shows the `off` icon, true shows the `on` icon. The change cross-fades with a small turn and scale. */\n  active?: boolean;\n  on: UiIcon;\n  off: UiIcon;\n}\nexport declare const IconSwap: (props: IconSwapProps) => ReactElement;\n" }],
});
