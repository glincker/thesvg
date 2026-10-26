// One .svelte file per icon and look: outline is shield-check.svelte, the rest add the look (shield-check-glass.svelte).
// The barrel exports ShieldCheckIcon, ShieldCheckGlassIcon and so on, so unused looks never reach a bundle.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const dist = resolve(here, "../dist");
const manifest = JSON.parse(readFileSync(join(root, "src/data/ui-icons.json"), "utf8"));
const pascal = (slug) => slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
const exportName = (slug, look) => `${/^[0-9]/.test(slug) ? "I" : ""}${pascal(slug)}${look === "outline" ? "" : pascal(look)}Icon`;
const fileBase = (slug, look) => (look === "outline" ? slug : `${slug}-${look}`);
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const be = [], bd = [];
for (const icon of manifest.icons) {
  for (const look of manifest.looks) {
    const base = fileBase(icon.slug, look);
    const html = JSON.stringify(inner(readFileSync(join(root, "public/ui", icon.slug, `${look}.svg`), "utf8")));
    writeFileSync(join(dist, `${base}.svelte`), `<script>\n  export let size = 24;\n</script>\n\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} overflow="visible" aria-hidden={$$restProps["aria-label"] ? undefined : "true"} {...$$restProps}>{@html ${html}}</svg>\n`);
    writeFileSync(join(dist, `${base}.svelte.d.ts`), `import type { SvelteComponent } from "svelte";\nimport type { SVGAttributes } from "svelte/elements";\n\nexport default class ${exportName(icon.slug, look)} extends SvelteComponent<SVGAttributes<SVGSVGElement> & { size?: number | string }> {}\n`);
    const line = `export { default as ${exportName(icon.slug, look)} } from "./${base}.svelte";`;
    be.push(line);
    bd.push(line);
  }
}
writeFileSync(join(dist, "index.js"), be.join("\n") + "\n");
writeFileSync(join(dist, "index.d.ts"), bd.join("\n") + "\n");
console.log(`built @thesvg/ui-svelte: ${manifest.icons.length} icons x ${manifest.looks.length} looks`);
