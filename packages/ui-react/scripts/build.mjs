import { fileURLToPath } from "node:url";
import { buildJsPackage } from "../../../scripts/ui/package-builder.mjs";

buildJsPackage(fileURLToPath(new URL("..", import.meta.url)), {
  name: "@thesvg/ui-react",
  markup: "inner",
  factory: `import { createElement, forwardRef, useId } from "react";
import { scoper } from "./_scope.js";
const liftOf = (shadow, size) => {
  const a = shadow === true ? 0.3 : Number(shadow) || 0;
  if (a <= 0) return undefined;
  const k = (Number(size) || 24) / 24;
  return "drop-shadow(0 " + (k).toFixed(2) + "px " + (k * 1.8).toFixed(2) + "px color-mix(in srgb, currentColor " + Math.round(Math.min(1, a) * 100) + "%, transparent))";
};
export const make = (html, name, ids) => {
  const scope = scoper(ids);
  const Icon = forwardRef(({ size = 24, shadow = 0, style, ...props }, ref) => {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    return createElement("svg", { ref, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: size, height: size, overflow: "visible", style: liftOf(shadow, size) ? { ...style, filter: liftOf(shadow, size) } : style, "aria-hidden": props["aria-label"] ? undefined : true, ...props, dangerouslySetInnerHTML: { __html: scope(html, uid) } });
  });
  Icon.displayName = name;
  return Icon;
};
`,
  factoryDts: `import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";
export interface UiIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> { size?: number | string; /** Lift shadow under the icon: true, or an opacity from 0 to 1. Works on every look. */ shadow?: boolean | number }
export type UiIcon = ForwardRefExoticComponent<UiIconProps & RefAttributes<SVGSVGElement>>;
export declare const make: (html: string, name: string, ids: string[]) => UiIcon;
`,
  iconDtsImport: `import type { UiIcon } from "./_make.js";`,
  barrelDtsExtra: `export type { UiIcon, UiIconProps } from "./_make.js";`,
});
