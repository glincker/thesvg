import { buildJsPackage } from "../../../scripts/ui/package-builder.mjs";

// React Native has no currentColor, so every component swaps a color prop into the SVG text first.
buildJsPackage(new URL("..", import.meta.url).pathname, {
  name: "@thesvg/ui-react-native",
  markup: "full",
  factory: `import { createElement } from "react";
import { SvgXml } from "react-native-svg";
export const make = (xml, name) => {
  const Icon = ({ size = 24, color = "#000000", ...props }) =>
    createElement(SvgXml, { xml: xml.split("currentColor").join(color), width: size, height: size, ...props });
  Icon.displayName = name;
  return Icon;
};
`,
  factoryDts: `import type { FunctionComponent } from "react";
import type { SvgProps } from "react-native-svg";
export interface UiIconProps extends Omit<SvgProps, "width" | "height" | "color"> { size?: number | string; color?: string }
export type UiIcon = FunctionComponent<UiIconProps>;
export declare const make: (xml: string, name: string) => UiIcon;
`,
  iconDtsImport: `import type { UiIcon } from "./_make.js";`,
  barrelDtsExtra: `export type { UiIcon, UiIconProps } from "./_make.js";`,
});
