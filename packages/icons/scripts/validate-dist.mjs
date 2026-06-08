#!/usr/bin/env node

/**
 * Pre-publish validation for @thesvg/icons.
 * Checks: file count, bundle budget, required files, import sanity.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");

/**
 * Reserved-word slugs (e.g., "await") must NOT appear bare as a binding name
 * in generated .js or .d.ts files — they'd produce a syntax error in the
 * consumer's typecheck and break the whole package. `toSafeIdentifier`
 * already escapes these at generation time; this guard catches any future
 * regression where a new code path forgets to call it.
 *
 * v3.0.10 shipped a broken `await.d.ts` (issue #530) — this check exists
 * specifically to prevent that recurrence.
 */
const RESERVED_IDENTIFIERS = new Set([
  "await", "break", "case", "catch", "class", "const", "continue",
  "debugger", "default", "delete", "do", "else", "enum", "export",
  "extends", "false", "finally", "for", "function", "if", "implements",
  "import", "in", "instanceof", "interface", "let", "new", "null",
  "package", "private", "protected", "public", "return", "static",
  "super", "switch", "this", "throw", "true", "try", "typeof", "var",
  "void", "while", "with", "yield", "arguments", "eval",
]);

// Budget: warn if total dist exceeds 50MB (icon strings are large)
const BUDGET_WARN_MB = 50;
const BUDGET_FAIL_MB = 100;

async function main() {
  const errors = [];
  const warnings = [];

  // 1. Check required files exist
  const required = ["LICENSE", "README.md", "package.json"];
  for (const file of required) {
    try {
      await fs.access(path.join(ROOT, file));
    } catch {
      errors.push(`Missing required file: ${file}`);
    }
  }

  // 2. Check dist exists and has files
  let distFiles;
  try {
    distFiles = await fs.readdir(DIST);
  } catch {
    errors.push("dist/ directory not found. Run build first.");
    report(errors, warnings);
    return;
  }

  const jsFiles = distFiles.filter((f) => f.endsWith(".js"));
  const cjsFiles = distFiles.filter((f) => f.endsWith(".cjs"));
  const dtsFiles = distFiles.filter((f) => f.endsWith(".d.ts"));

  // Should have index + types + per-icon files
  if (jsFiles.length < 100) {
    errors.push(`Too few ESM files: ${jsFiles.length} (expected 3000+)`);
  }
  if (cjsFiles.length < 100) {
    errors.push(`Too few CJS files: ${cjsFiles.length} (expected 3000+)`);
  }
  if (dtsFiles.length < 100) {
    errors.push(`Too few DTS files: ${dtsFiles.length} (expected 3000+)`);
  }

  // ESM and CJS counts should match
  if (jsFiles.length !== cjsFiles.length) {
    warnings.push(
      `ESM/CJS mismatch: ${jsFiles.length} .js vs ${cjsFiles.length} .cjs`,
    );
  }

  // 3. Check barrel files exist
  const barrels = ["index.js", "index.cjs", "index.d.ts", "types.d.ts"];
  for (const barrel of barrels) {
    if (!distFiles.includes(barrel)) {
      errors.push(`Missing barrel: dist/${barrel}`);
    }
  }

  // 4. Bundle budget
  let totalSize = 0;
  for (const file of distFiles) {
    const stat = await fs.stat(path.join(DIST, file));
    totalSize += stat.size;
  }
  const sizeMB = totalSize / 1024 / 1024;

  if (sizeMB > BUDGET_FAIL_MB) {
    errors.push(`Bundle too large: ${sizeMB.toFixed(1)}MB (max ${BUDGET_FAIL_MB}MB)`);
  } else if (sizeMB > BUDGET_WARN_MB) {
    warnings.push(`Bundle size: ${sizeMB.toFixed(1)}MB (budget: ${BUDGET_WARN_MB}MB)`);
  }

  // 5a. Reserved-word identifier guard.
  // Scan every emitted .d.ts and .js for `(declare )?const <id>` at the top
  // level — if <id> is a JS reserved word, the file is a syntax error and
  // will break consumer typechecks (regression of #530).
  const dtsRe = /^declare const (\w+):/m;
  const jsRe = /^const (\w+)\s*=/m;
  for (const file of dtsFiles) {
    const content = await fs.readFile(path.join(DIST, file), "utf8");
    const m = content.match(dtsRe);
    if (m && RESERVED_IDENTIFIERS.has(m[1])) {
      errors.push(
        `${file}: emits \`declare const ${m[1]}\` — reserved word, will break tsc. ` +
          `Check toSafeIdentifier() in build-icons.ts.`,
      );
    }
  }
  for (const file of jsFiles) {
    if (file === "index.js" || file === "types.js") continue;
    const content = await fs.readFile(path.join(DIST, file), "utf8");
    const m = content.match(jsRe);
    if (m && RESERVED_IDENTIFIERS.has(m[1])) {
      errors.push(
        `${file}: emits bare \`const ${m[1]}\` — reserved word, syntax error. ` +
          `Check toSafeIdentifier() in build-icons.ts.`,
      );
    }
  }

  // 5b. Spot check: import well-known icons to verify modules work.
  // Always include "await.js" if present — it's the canonical reserved-word
  // case that broke 3.0.10. Failing to import = something is structurally
  // wrong, not just a sample miss.
  const sampleNames = ["github.js", "google.js", "vercel.js", "apple.js", "await.js"];
  const candidates = sampleNames.filter((n) => jsFiles.includes(n));
  // Fallback to first non-barrel if none of the well-known names exist
  if (candidates.length === 0) {
    const fallback = jsFiles.find((f) => f !== "index.js" && f !== "types.js");
    if (fallback) candidates.push(fallback);
  }
  for (const sampleIcon of candidates) {
    try {
      const mod = await import(path.join(DIST, sampleIcon));
      if (!mod.slug || !mod.title) {
        errors.push(`Sample icon ${sampleIcon} missing required exports (slug/title)`);
      }
    } catch (err) {
      errors.push(`Sample icon ${sampleIcon} failed to import: ${err.message}`);
    }
  }

  // 6. Check package.json exports
  const pkg = JSON.parse(await fs.readFile(path.join(ROOT, "package.json"), "utf8"));
  if (!pkg.exports) {
    errors.push("package.json missing exports field");
  }
  if (pkg.sideEffects !== false) {
    warnings.push("package.json sideEffects should be false for tree-shaking");
  }

  report(errors, warnings);

  console.log(`\nStats:`);
  console.log(`  ESM files:  ${jsFiles.length}`);
  console.log(`  CJS files:  ${cjsFiles.length}`);
  console.log(`  DTS files:  ${dtsFiles.length}`);
  console.log(`  Total size: ${sizeMB.toFixed(1)}MB`);
}

function report(errors, warnings) {
  if (warnings.length > 0) {
    console.warn(`\n[validate] Warnings:`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (errors.length > 0) {
    console.error(`\n[validate] FAIL - ${errors.length} errors:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n[validate] PASS`);
}

main().catch((err) => {
  console.error("[validate] Error:", err);
  process.exitCode = 1;
});
