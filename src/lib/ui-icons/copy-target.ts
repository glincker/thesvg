import { packageCode } from "./snippets";

export const COPY_TARGETS = ["svg", "name", "cli", "react", "vue", "svelte", "url"] as const;
export type CopyTarget = (typeof COPY_TARGETS)[number];

export const COPY_LABEL: Record<CopyTarget, string> = { svg: "SVG", name: "Name", cli: "CLI", react: "React", vue: "Vue", svelte: "Svelte", url: "URL" };
export const COPY_HINT: Record<CopyTarget, string> = {
  svg: "The drawing, in your style",
  name: "The icon name",
  cli: "The command that adds it",
  react: "Import and usage for @thesvg/ui-react",
  vue: "Import and usage for @thesvg/ui-vue",
  svelte: "Import and usage for @thesvg/ui-svelte",
  url: "A link to the SVG on the CDN",
};

export const isCopyTarget = (v: string | null): v is CopyTarget => COPY_TARGETS.some((t) => t === v);

/** What lands on the clipboard for one icon, so the card, the quick view and the detail page all agree. */
export function copyText(target: CopyTarget, input: { svg: string; slug: string; look: string }): string {
  const { svg, slug, look } = input;
  if (target === "svg") return svg;
  if (target === "name") return slug;
  if (target === "cli") return `npx @thesvg/cli add ui:${slug}${look === "outline" ? "" : ` --look ${look}`}`;
  if (target === "url") return `https://thesvg.org/ui/${slug}/${look}.svg`;
  return packageCode(target, slug, look);
}
