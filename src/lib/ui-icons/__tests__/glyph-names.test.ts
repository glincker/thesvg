import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GLYPH_BY_SLUG, VARIANTS } from "../glyphs";

const SRC = join(__dirname, "../../..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" || name === "engine" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("<UiGlyph> icon names", () => {
  const files = sourceFiles(SRC).filter((f) => readFileSync(f, "utf8").includes("<UiGlyph"));

  it("is used somewhere, so this test is not checking nothing", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("only uses names that exist in the UI icon set, and only looks that exist", () => {
    const missing: string[] = [];
    for (const file of files) {
      const code = readFileSync(file, "utf8");
      for (const m of code.matchAll(/<UiGlyph\b[^>]*?\bname="([a-z0-9-]+)"/g)) {
        if (!GLYPH_BY_SLUG.has(m[1])) missing.push(`${file.replace(SRC, "src")}: ${m[1]}`);
      }
      for (const m of code.matchAll(/<UiGlyph\b[^>]*?\blook="([a-z]+)"/g)) {
        if (!(VARIANTS as readonly string[]).includes(m[1])) missing.push(`${file.replace(SRC, "src")}: look ${m[1]}`);
      }
      // Names passed through data, such as { icon: "book-open" } lists, are checked too.
      for (const m of code.matchAll(/\bicon: "([a-z0-9-]+)"/g)) {
        if (!GLYPH_BY_SLUG.has(m[1]) && !/ui-state|icon-card/.test(file)) missing.push(`${file.replace(SRC, "src")}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("UI components do not use third-party icon libraries", () => {
  it("has no lucide or phosphor imports in the UI icon code", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => /ui-icons|\/app\/ui\//.test(f))
      .filter((f) => /from "(lucide-react|@phosphor-icons)/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
