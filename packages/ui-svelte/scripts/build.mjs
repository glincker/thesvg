import { buildSveltePackage } from "../../../scripts/ui/package-builder.mjs";

buildSveltePackage(new URL("..", import.meta.url).pathname, "@thesvg/ui-svelte");
