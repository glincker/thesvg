import { buildJsPackage } from "../../../scripts/ui/package-builder.mjs";

buildJsPackage(new URL("..", import.meta.url).pathname, {
  name: "@thesvg/ui-vue",
  markup: "inner",
  factory: `import { defineComponent, h } from "vue";
export const make = (html, name) => defineComponent({
  name,
  props: { size: { type: [Number, String], default: 24 } },
  setup(props, { attrs }) {
    return () => h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: props.size, height: props.size, overflow: "visible", "aria-hidden": attrs["aria-label"] ? undefined : "true", innerHTML: html });
  },
});
`,
  factoryDts: `import type { DefineComponent } from "vue";
export type UiIcon = DefineComponent<{ size?: number | string }>;
export declare const make: (html: string, name: string) => UiIcon;
`,
  iconDtsImport: `import type { UiIcon } from "./_make.js";`,
  barrelDtsExtra: `export type { UiIcon } from "./_make.js";`,
});
