import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/** Tracked paths, or null when the tests run outside a git checkout. */
function trackedPaths(): string[] | null {
  try {
    return execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 26 })
      .split("\0")
      .filter(Boolean);
  } catch {
    return null;
  }
}

describe("tracked paths", () => {
  const paths = trackedPaths();

  it.skipIf(paths === null)("never differ only by letter case", () => {
    // macOS and Windows checkouts are case-insensitive: two paths like
    // .Jules/palette.md and .jules/palette.md land on the same file, so one
    // always shows as modified and blocks `git checkout`.
    const byLowercase = new Map<string, string[]>();
    for (const path of paths ?? []) {
      const key = path.toLowerCase();
      byLowercase.set(key, [...(byLowercase.get(key) ?? []), path]);
    }
    const collisions = [...byLowercase.values()].filter((group) => group.length > 1);
    expect(collisions).toEqual([]);
  });
});
