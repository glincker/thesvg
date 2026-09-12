import { test, mock } from "node:test";
import { strict as assert } from "node:assert";
import { parseAddArgs } from "./add.js";

test("parses simple slugs without options", () => {
  const result = parseAddArgs(["github", "vercel"]);
  assert.deepEqual(result, {
    slugs: ["github", "vercel"],
    variant: "default",
    dir: undefined,
    format: "svg",
  });
});

test("parses --variant or -v", () => {
  assert.equal(parseAddArgs(["github", "--variant", "light"]).variant, "light");
  assert.equal(parseAddArgs(["github", "-v", "dark"]).variant, "dark");
  assert.equal(parseAddArgs(["github", "--variant=light"]).variant, "light");
});

test("parses --dir or -d", () => {
  assert.equal(parseAddArgs(["github", "--dir", "icons"]).dir, "icons");
  assert.equal(parseAddArgs(["github", "-d", "src/icons"]).dir, "src/icons");
  assert.equal(parseAddArgs(["github", "--dir=assets"]).dir, "assets");
});

test("parses --format or -f with valid formats", () => {
  assert.equal(parseAddArgs(["github", "--format", "jsx"]).format, "jsx");
  assert.equal(parseAddArgs(["github", "-f", "vue"]).format, "vue");
  assert.equal(parseAddArgs(["github", "--format=svg"]).format, "svg");
});

test("handles unknown format by exiting", () => {
  // Mock process.exit to prevent the test runner from exiting
  const exitMock = mock.method(process, "exit", (code: number) => {
    throw new Error(`process.exit called with ${code}`);
  });

  const errorMock = mock.method(console, "error", () => {}); // silence output

  assert.throws(() => {
    parseAddArgs(["github", "--format", "unknown"]);
  }, /process\.exit called with 1/);

  assert.throws(() => {
    parseAddArgs(["github", "--format=unknown"]);
  }, /process\.exit called with 1/);

  exitMock.mock.restore();
  errorMock.mock.restore();
});
