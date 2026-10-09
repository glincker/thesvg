/**
 * Audit every SVG under public/icons with the static rules in lib/audit-svg.
 * Exits non-zero when any file violates a rule.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { auditSvg } from "./lib/audit-svg";

const ICONS_DIR = resolve(import.meta.dirname, "../../../public/icons");
const ROOT = resolve(import.meta.dirname, "../../..");

/**
 * Known violations pending a follow-up (the glincker wordmarks embed a raster
 * image). Keyed by path relative to public/icons, value is the allowed rule.
 * Remove entries as the files are replaced with vector artwork.
 */
const KNOWN: ReadonlyMap<string, string> = new Map([
  ["glincker/wordmark.svg", "embedded-raster"],
  ["glincker/wordmark-light.svg", "embedded-raster"],
  ["glincker/wordmark-dark.svg", "embedded-raster"],
]);

function main(): void {
  let scanned = 0;
  const violations: string[] = [];
  for (const dir of readdirSync(ICONS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of readdirSync(join(ICONS_DIR, dir.name))) {
      if (!file.endsWith(".svg")) continue;
      const path = join(ICONS_DIR, dir.name, file);
      scanned++;
      const findings = auditSvg(readFileSync(path, "utf8"));
      for (const f of findings) {
        if (KNOWN.get(`${dir.name}/${file}`) === f.rule) continue;
        violations.push(`${relative(ROOT, path)} [${f.rule}] ${f.message}`);
      }
    }
  }
  if (violations.length > 0) {
    console.error(`[svg-audit] FAIL - ${violations.length} findings in ${scanned} files:`);
    for (const v of violations) console.error(`  ${v}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[svg-audit] PASS (${scanned} svg files clean)`);
}

main();
