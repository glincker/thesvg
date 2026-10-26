import { fileURLToPath } from "node:url";
import { buildSveltePackage } from "../../../scripts/ui/package-builder.mjs";

buildSveltePackage(fileURLToPath(new URL("..", import.meta.url)), "@thesvg/ui-svelte");
