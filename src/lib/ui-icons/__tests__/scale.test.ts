import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "../../..");
const UI_DIRS = ["components/ui-icons", "app/ui", "lib/ui-icons"].map((d) => join(SRC, d));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" || name === "engine" ? [] : files(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("UI icon code scales with the interface size", () => {
  it("sizes text in rem, never fixed pixels, so the Interface size setting reaches every label", () => {
    const offenders: string[] = [];
    for (const file of UI_DIRS.flatMap(files)) {
      for (const m of readFileSync(file, "utf8").matchAll(/text-\[[\d.]+px\]/g)) offenders.push(`${file.replace(SRC, "src")}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the smallest label at 12px at the default size", () => {
    const small: string[] = [];
    for (const file of UI_DIRS.flatMap(files)) {
      for (const m of readFileSync(file, "utf8").matchAll(/text-\[([\d.]+)rem\]/g)) {
        if (Number(m[1]) < 0.75) small.push(`${file.replace(SRC, "src")}: ${m[0]}`);
      }
    }
    expect(small).toEqual([]);
  });
});
