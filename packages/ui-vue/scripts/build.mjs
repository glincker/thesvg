import { fileURLToPath } from "node:url";
import { buildJsPackage } from "../../../scripts/ui/package-builder.mjs";

buildJsPackage(fileURLToPath(new URL("..", import.meta.url)), {
  name: "@thesvg/ui-vue",
  markup: "inner",
  factory: `import { defineComponent, getCurrentInstance, h } from "vue";
import { scoper } from "./_scope.js";
export const make = (html, name, ids) => {
  const scope = scoper(ids);
  return defineComponent({
    name,
    props: { size: { type: [Number, String], default: 24 } },
    setup(props, { attrs }) {
      const markup = scope(html, getCurrentInstance()?.uid ?? 0);
      return () => h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: props.size, height: props.size, overflow: "visible", "aria-hidden": attrs["aria-label"] ? undefined : "true", innerHTML: markup });
    },
  });
};
`,
  factoryDts: `import type { DefineComponent } from "vue";
export type UiIcon = DefineComponent<{ size?: number | string }>;
export declare const make: (html: string, name: string, ids: string[]) => UiIcon;
`,
  iconDtsImport: `import type { UiIcon } from "./_make.js";`,
  barrelDtsExtra: `export type { UiIcon } from "./_make.js";`,
});
