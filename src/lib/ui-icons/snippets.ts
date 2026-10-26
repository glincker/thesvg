export const USE_TABS = ["react", "vue", "svelte", "html", "css"] as const;
export const COPY_TABS = ["svg", "uri"] as const;
export type SnippetTab = (typeof USE_TABS)[number] | (typeof COPY_TABS)[number];

export const pascal = (slug: string): string => `${slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}Icon`;
const camel = (svg: string): string => svg.replace(/\s([a-z]+(?:-[a-z]+)+)=/g, (_m, a: string) => ` ${a.replace(/-([a-z])/g, (_x, c: string) => c.toUpperCase())}=`);
// Only the root element loses its size. Rectangles inside masks need their width and height or the icon loses its shape.
const noSize = (svg: string): string => svg.replace(/^<svg[^>]*>/, (root) => root.replace(/\s(width|height)="[^"]*"/g, ""));
const pretty = (svg: string): string => svg.replace(/></g, ">\n<");

export function codeFor(tab: SnippetTab, svg: string, slug: string): string {
  const name = pascal(slug);
  if (tab === "react") return `import type { SVGProps } from "react";\n\nexport function ${name}(props: SVGProps<SVGSVGElement>) {\n  return (\n    ${camel(noSize(pretty(svg))).replace(/<svg /, "<svg {...props} ")}\n  );\n}`;
  if (tab === "vue") return `<template>\n  ${noSize(pretty(svg)).replace(/<svg /, "<svg v-bind=\"$attrs\" ")}\n</template>`;
  if (tab === "svelte") return noSize(pretty(svg)).replace(/<svg /, "<svg {...$$restProps} ");
  if (tab === "html") return pretty(svg);
  if (tab === "css") return `.icon-${slug} {\n  width: 1.5rem;\n  height: 1.5rem;\n  background-color: currentColor;\n  mask: url("data:image/svg+xml,${encodeURIComponent(svg)}") center / contain no-repeat;\n}`;
  if (tab === "svg") return pretty(svg);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
