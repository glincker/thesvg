export const USE_TABS = ["react", "vue", "svelte", "native", "js", "html", "css"] as const;
export const COPY_TABS = ["svg", "uri"] as const;
export type SnippetTab = (typeof USE_TABS)[number] | (typeof COPY_TABS)[number];

/** Tabs that have an installable package. React, Vue and Svelte also keep a copy-paste component source. */
export const PACKAGE_TABS = ["react", "vue", "svelte", "native", "js"] as const satisfies readonly SnippetTab[];
export const SOURCE_TABS = ["react", "vue", "svelte"] as const satisfies readonly SnippetTab[];
export type PackageTab = (typeof PACKAGE_TABS)[number];
export type SourceTab = Exclude<SnippetTab, "native" | "js">;

export const pascal = (slug: string): string => `${slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}Icon`;
const camel = (svg: string): string => svg.replace(/\s([a-z]+(?:-[a-z]+)+)=/g, (_m, a: string) => ` ${a.replace(/-([a-z])/g, (_x, c: string) => c.toUpperCase())}=`);
// Only the root element loses its size. Rectangles inside masks need their width and height or the icon loses its shape.
const noSize = (svg: string): string => svg.replace(/^<svg[^>]*>/, (root) => root.replace(/\s(width|height)="[^"]*"/g, ""));
const pretty = (svg: string): string => svg.replace(/></g, ">\n<");

export function codeFor(tab: SourceTab, svg: string, slug: string): string {
  const name = pascal(slug);
  if (tab === "react") return `import type { SVGProps } from "react";\n\nexport function ${name}(props: SVGProps<SVGSVGElement>) {\n  return (\n    ${camel(noSize(pretty(svg))).replace(/<svg /, "<svg {...props} ")}\n  );\n}`;
  if (tab === "vue") return `<template>\n  ${noSize(pretty(svg)).replace(/<svg /, "<svg v-bind=\"$attrs\" ")}\n</template>`;
  if (tab === "svelte") return noSize(pretty(svg)).replace(/<svg /, "<svg {...$$restProps} ");
  if (tab === "html") return pretty(svg);
  if (tab === "css") return `.icon-${slug} {\n  width: 1.5rem;\n  height: 1.5rem;\n  background-color: currentColor;\n  mask: url("data:image/svg+xml,${encodeURIComponent(svg)}") center / contain no-repeat;\n}`;
  if (tab === "svg") return pretty(svg);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const PASCAL = (slug: string): string => slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");

/** The export a package gives an icon in a look: outline is BellIcon, the others add the look (BellGlassIcon). Mirrors scripts/ui/package-builder.mjs. */
export function exportName(slug: string, look: string): string {
  return `${/^[0-9]/.test(slug) ? "I" : ""}${PASCAL(slug)}${look === "outline" ? "" : PASCAL(look)}Icon`;
}

const PACKAGES: Record<Exclude<PackageTab, "js">, string> = { react: "@thesvg/ui-react", vue: "@thesvg/ui-vue", svelte: "@thesvg/ui-svelte", native: "@thesvg/ui-react-native" };

/** The shell command that installs the package for a tab. */
export function installCommand(tab: PackageTab): string {
  if (tab === "js") return "npm install @thesvg/ui";
  return tab === "native" ? `npm install ${PACKAGES.native} react-native-svg` : `npm install ${PACKAGES[tab]}`;
}

/** How to use the published package for a tab, in the chosen look. The copied source stays in codeFor. */
export function packageCode(tab: PackageTab, slug: string, look: string): string {
  const name = exportName(slug, look);
  if (tab === "react") return `import { ${name} } from "@thesvg/ui-react";\n\nexport function Example() {\n  return <${name} size={24} />;\n}`;
  if (tab === "vue") return `<script setup lang="ts">\nimport { ${name} } from "@thesvg/ui-vue";\n</script>\n\n<template>\n  <${name} :size="24" />\n</template>`;
  if (tab === "svelte") return `<script>\n  import { ${name} } from "@thesvg/ui-svelte";\n</script>\n\n<${name} size={24} />`;
  if (tab === "native") return `import { ${name} } from "@thesvg/ui-react-native";\n\nexport function Example() {\n  return <${name} size={24} color="#111111" />;\n}`;
  return `<!-- from a CDN, no install -->\n<img src="https://cdn.jsdelivr.net/npm/@thesvg/ui/dist/svg/${slug}/${look}.svg" width="24" height="24" alt="" />\n\n// or from the package: @thesvg/ui/svg/${slug}/${look}.svg`;
}
