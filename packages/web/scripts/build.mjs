// ESM + declarations via tsc, then a CJS build renamed to .cjs so the "require" export resolves.
import { execFileSync } from "node:child_process";
import { renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tsc = createRequire(join(pkg, "package.json")).resolve("typescript/bin/tsc");
rmSync(join(pkg, "dist"), { recursive: true, force: true });
execFileSync(process.execPath, [tsc, "-p", join(pkg, "tsconfig.json")], { stdio: "inherit" });
execFileSync(process.execPath, [tsc, "-p", join(pkg, "tsconfig.cjs.json")], { stdio: "inherit" });
renameSync(join(pkg, "dist/cjs/index.js"), join(pkg, "dist/cjs/index.cjs"));
console.log("built @thesvg/web");
