import { test, describe } from "node:test";
import { strict as assert } from "node:assert";

import { parseListArgs } from "../../src/commands/list.ts";

describe("parseListArgs", () => {
  test("returns default options when no args are provided", () => {
    const opts = parseListArgs([]);
    assert.equal(opts.category, undefined);
    assert.equal(opts.limit, 50);
  });

  test("parses --category with space", () => {
    const opts = parseListArgs(["--category", "social"]);
    assert.equal(opts.category, "social");
  });

  test("parses -c with space", () => {
    const opts = parseListArgs(["-c", "social"]);
    assert.equal(opts.category, "social");
  });

  test("parses --category= with equals", () => {
    const opts = parseListArgs(["--category=social"]);
    assert.equal(opts.category, "social");
  });

  test("parses --limit with space", () => {
    const opts = parseListArgs(["--limit", "10"]);
    assert.equal(opts.limit, 10);
  });

  test("parses -l with space", () => {
    const opts = parseListArgs(["-l", "10"]);
    assert.equal(opts.limit, 10);
  });

  test("parses --limit= with equals", () => {
    const opts = parseListArgs(["--limit=10"]);
    assert.equal(opts.limit, 10);
  });

  test("falls back to default limit when limit arg is missing value", () => {
    const opts = parseListArgs(["--limit"]);
    assert.equal(opts.limit, 50);
  });

  test("falls back to default limit when limit arg is invalid", () => {
    const opts = parseListArgs(["--limit", "abc"]);
    assert.equal(opts.limit, 50);
  });

  test("falls back to default limit when limit= is invalid", () => {
    const opts = parseListArgs(["--limit=abc"]);
    assert.equal(opts.limit, 50);
  });

  test("falls back to default limit when limit is 0", () => {
    const opts = parseListArgs(["--limit", "0"]);
    assert.equal(opts.limit, 50);
  });

  test("falls back to default limit when limit is negative", () => {
    const opts = parseListArgs(["--limit", "-5"]);
    assert.equal(opts.limit, 50);
  });

  test("parses multiple arguments combined", () => {
    const opts = parseListArgs(["-c", "social", "--limit=20"]);
    assert.equal(opts.category, "social");
    assert.equal(opts.limit, 20);
  });

  test("parses multiple arguments combined, different order", () => {
    const opts = parseListArgs(["--limit", "20", "--category", "social"]);
    assert.equal(opts.category, "social");
    assert.equal(opts.limit, 20);
  });
});
