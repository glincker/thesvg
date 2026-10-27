import { fileURLToPath } from "node:url";
import { buildJsPackage } from "../../../scripts/ui/package-builder.mjs";

buildJsPackage(fileURLToPath(new URL("..", import.meta.url)), {
  name: "@thesvg/ui-vue",
  markup: "inner",
  factory: `import { defineComponent, getCurrentInstance, h } from "vue";
import { scoper } from "./_scope.js";
const liftOf = (shadow, size) => {
  const a = shadow === true ? 0.3 : Number(shadow) || 0;
  if (a <= 0) return undefined;
  const k = (Number(size) || 24) / 24;
  return "drop-shadow(0 " + (k).toFixed(2) + "px " + (k * 1.8).toFixed(2) + "px color-mix(in srgb, currentColor " + Math.round(Math.min(1, a) * 100) + "%, transparent))";
};
export const make = (html, name, ids) => {
  const scope = scoper(ids);
  return defineComponent({
    name,
    props: { size: { type: [Number, String], default: 24 }, shadow: { type: [Boolean, Number], default: 0 } },
    setup(props, { attrs }) {
      const markup = scope(html, getCurrentInstance()?.uid ?? 0);
      return () => h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: props.size, height: props.size, overflow: "visible", style: liftOf(props.shadow, props.size) ? { filter: liftOf(props.shadow, props.size) } : undefined, "aria-hidden": attrs["aria-label"] ? undefined : "true", innerHTML: markup });
    },
  });
};
`,
  factoryDts: `import type { DefineComponent } from "vue";
export type UiIcon = DefineComponent<{ size?: number | string; /** Lift shadow under the icon: true, or an opacity from 0 to 1. Works on every look. */ shadow?: boolean | number }>;
export declare const make: (html: string, name: string, ids: string[]) => UiIcon;
`,
  iconDtsImport: `import type { UiIcon } from "./_make.js";`,
  barrelDtsExtra: `export type { UiIcon } from "./_make.js";`,
});
