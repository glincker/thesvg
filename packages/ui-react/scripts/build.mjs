import { fileURLToPath } from "node:url";
import { buildJsPackage } from "../../../scripts/ui/package-builder.mjs";

buildJsPackage(fileURLToPath(new URL("..", import.meta.url)), {
  name: "@thesvg/ui-react",
  markup: "inner",
  factory: `import { createElement, forwardRef, useId } from "react";
import { scoper } from "./_scope.js";
export const make = (html, name, ids) => {
  const scope = scoper(ids);
  const Icon = forwardRef(({ size = 24, ...props }, ref) => {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    return createElement("svg", { ref, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: size, height: size, overflow: "visible", "aria-hidden": props["aria-label"] ? undefined : true, ...props, dangerouslySetInnerHTML: { __html: scope(html, uid) } });
  });
  Icon.displayName = name;
  return Icon;
};
`,
  factoryDts: `import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";
export interface UiIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> { size?: number | string }
export type UiIcon = ForwardRefExoticComponent<UiIconProps & RefAttributes<SVGSVGElement>>;
export declare const make: (html: string, name: string, ids: string[]) => UiIcon;
`,
  iconDtsImport: `import type { UiIcon } from "./_make.js";`,
  barrelDtsExtra: `export type { UiIcon, UiIconProps } from "./_make.js";`,
});
