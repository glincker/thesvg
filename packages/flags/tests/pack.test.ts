import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Export conditions nest (import and require each carry their own types), so walk the whole map.
const collect = (v: unknown): string[] => (typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(collect) : []);

test("the packed tarball contains every file the exports map points at", () => {
  const dest = mkdtempSync(join(tmpdir(), "flags-pack-"));
  try {
    const packed = spawnSync("pnpm", ["pack", "--pack-destination", dest], { cwd: PKG, encoding: "utf8" });
    assert.equal(packed.status, 0, packed.stderr);
    const tarball = packed.stdout.trim().split("\n").pop()!.trim();
    const list = spawnSync("tar", ["-tzf", tarball.startsWith("/") ? tarball : join(dest, tarball)], { encoding: "utf8", maxBuffer: 1 << 28 });
    assert.equal(list.status, 0, list.stderr);
    const files = new Set(list.stdout.split("\n").map((l) => l.replace(/^package\//, "")));
    const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")) as { exports: Record<string, unknown>; main: string; module: string; types: string };
    const targets = [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.exports).flatMap(collect)];
    for (const t of targets) {
      const path = t.replace(/^\.\//, "");
      if (path.includes("*")) {
        const re = new RegExp("^" + path.replace(/[.]/g, "\\.").replace("*", ".+") + "$");
        assert.ok([...files].some((f) => re.test(f)), `no file for ${t}`);
      } else assert.ok(files.has(path), `missing ${t}`);
    }
    for (const f of ["README.md", "LICENSE", "THIRD_PARTY_NOTICES.md"]) assert.ok(files.has(f), f);
  } finally { rmSync(dest, { recursive: true, force: true }); }
});
