import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../..", import.meta.url));
const CATALOG = join(SRC, "data/icons.json");

/** Every source module under src/, excluding tests. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return /\.(ts|tsx|mjs|js)$/.test(name) && !/\.test\.(ts|tsx|mjs)$/.test(name) ? [path] : [];
  });
}

/**
 * Static value imports and re-exports of a module. Type-only imports are
 * erased at compile time, and dynamic import() gets its own lazy chunk, so
 * neither can put a module into a client component's initial bundle.
 */
function valueImports(code: string): string[] {
  const specifiers: string[] = [];
  const statement = /^\s*(import|export)\s+(type\s+)?([^;]*?)\s*from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm;
  for (const m of code.matchAll(statement)) {
    if (m[5]) {
      specifiers.push(m[5]);
      continue;
    }
    if (m[2]) continue;
    const named = m[3].match(/\{([^}]*)\}/);
    const outsideBraces = m[3].replace(/\{[^}]*\}/, "").replace(/,/g, "").trim();
    const allTypes =
      named !== null &&
      outsideBraces === "" &&
      named[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .every((s) => s.startsWith("type "));
    if (!allTypes) specifiers.push(m[4]);
  }
  return specifiers;
}

function resolveImport(from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = join(SRC, specifier.slice(2));
  else if (specifier.startsWith(".")) base = resolve(dirname(from), specifier);
  else return null; // package import
  for (const candidate of [base, ...[".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx"].map((ext) => base + ext)]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function isClientModule(code: string): boolean {
  return /^(?:\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/))*\s*["']use client["']/.test(code);
}

/** Import chains from a client module to icons.json, as relative paths. */
function catalogChains(): string[] {
  const files = sourceFiles(SRC);
  const code = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
  const chains: string[] = [];
  for (const entry of files.filter((f) => isClientModule(code.get(f) ?? ""))) {
    const seen = new Set<string>();
    const walk = (file: string, path: string[]): void => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const specifier of valueImports(code.get(file) ?? "")) {
        const target = resolveImport(file, specifier);
        if (!target) continue;
        if (target === CATALOG) chains.push([...path, target].map((p) => relative(SRC, p)).join(" -> "));
        else if (code.has(target)) walk(target, [...path, target]);
      }
    };
    walk(entry, [entry]);
  }
  return chains;
}

describe("client bundles", () => {
  it("never statically import the icons.json catalog", () => {
    // icons.json is ~3 MB (about 340 KB gzipped). A client component that
    // imports it, even indirectly for one helper, ships the whole catalog to
    // every page that renders it. Client code should get icon data from props
    // or /api/icons-full.json instead.
    expect(catalogChains()).toEqual([]);
  });

  it("ignores type-only imports", () => {
    expect(valueImports('import type { A } from "@/lib/icons";')).toEqual([]);
    expect(valueImports('import { type A, type B } from "@/lib/icons";')).toEqual([]);
    expect(valueImports('import { f, type A } from "@/lib/icons";')).toEqual(["@/lib/icons"]);
    expect(valueImports('import data, { type A } from "@/lib/icons";')).toEqual(["@/lib/icons"]);
    expect(valueImports('export { f } from "./x";\nimport "./side-effect";')).toEqual(["./x", "./side-effect"]);
  });
});
