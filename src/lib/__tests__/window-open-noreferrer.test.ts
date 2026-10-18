import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".next") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe("window.open call sites", () => {
  const files = [
    ...walk(join(root, "src")),
    ...walk(join(root, "packages/mcp-worker/src")),
  ];

  it("scans the mcp-worker widget", () => {
    expect(files.some((f) => f.endsWith("mcp-worker/src/widget.ts"))).toBe(true);
  });

  it("every window.open passes noopener,noreferrer", () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const re = /window\.open\(/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const call = src.slice(m.index, m.index + 400).split(/\);/)[0];
        if (!/noopener,\s*noreferrer/.test(call)) {
          offenders.push(`${f}:${src.slice(0, m.index).split("\n").length}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
