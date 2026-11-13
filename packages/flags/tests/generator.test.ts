import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const GEN = resolve(dirname(fileURLToPath(import.meta.url)), "../../../scripts/flags/generate-flags.mjs");
const R43 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><path fill="#f00" d="M0 0h640v480H0z"/><path fill="#00f" d="M0 0h640v160H0z"/></svg>';
const R11 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#f00" d="M0 0h512v512H0z"/></svg>';

function fixture(dir: string, codes: string[]): { fi: string; cf: string } {
  const fi = join(dir, "fi");
  const cf = join(dir, "cf");
  for (const d of [join(fi, "flags/4x3"), join(fi, "flags/1x1"), join(cf, "flags")]) mkdirSync(d, { recursive: true });
  writeFileSync(join(fi, "package.json"), '{"version":"0.0.1"}');
  writeFileSync(join(fi, "LICENSE"), "MIT fixture");
  writeFileSync(join(cf, "LICENSE.md"), "MIT fixture");
  writeFileSync(join(fi, "country.json"), JSON.stringify(codes.map((c) => ({ code: c, continent: "Europe", capital: "X" }))));
  for (const c of codes) {
    writeFileSync(join(fi, "flags/4x3", `${c}.svg`), R43);
    writeFileSync(join(fi, "flags/1x1", `${c}.svg`), R11);
    writeFileSync(join(cf, "flags", `${c}.svg`), R11);
  }
  for (const d of [fi, cf]) {
    for (const cmd of [["init", "-q"], ["add", "-A"], ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "x"]]) spawnSync("git", ["-C", d, ...cmd]);
  }
  return { fi, cf };
}

const run = (fi: string, cf: string, root: string, only: string) =>
  spawnSync("node", [GEN, "--fi", fi, "--cf", cf, "--root", root, "--only", only], { encoding: "utf8", env: { ...process.env, FLAGS_ACCESS_DATE: "2026-01-01" } });

function tree(root: string): string {
  const h = createHash("sha256");
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else h.update(p.slice(root.length) + readFileSync(p));
    }
  };
  walk(root);
  return h.digest("hex");
}

test("the generator is deterministic: two runs produce identical trees", () => {
  const dir = mkdtempSync(join(tmpdir(), "flags-gen-"));
  try {
    const { fi, cf } = fixture(dir, ["us", "de"]);
    const a = join(dir, "out-a");
    const b = join(dir, "out-b");
    for (const out of [a, b, a]) { const r = run(fi, cf, out, "us,de"); assert.equal(r.status, 0, r.stderr); }
    assert.equal(tree(a), tree(b));
    assert.ok(existsSync(join(a, "public/icons/flag-us/circle.svg")));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a source tree missing a country aborts and leaves checked-in files untouched", () => {
  const dir = mkdtempSync(join(tmpdir(), "flags-gen-"));
  try {
    const { fi, cf } = fixture(dir, ["us", "de"]);
    const out = join(dir, "out");
    assert.equal(run(fi, cf, out, "us,de").status, 0);
    const before = tree(out);
    rmSync(join(fi, "flags/1x1/de.svg"));
    spawnSync("git", ["-C", fi, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qam", "drop"]);
    const r = run(fi, cf, out, "us,de");
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /missing flag-icons file for de/);
    assert.equal(tree(out), before);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
