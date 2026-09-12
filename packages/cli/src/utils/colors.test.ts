import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import { colors, colorize, success, error, warn, info, header, dim } from "./colors.ts";

const ESC = "\x1b";

describe("colors", () => {
  test("colorize applies the correct color code", () => {
    assert.equal(colorize("red", "text"), `${ESC}[31mtext${ESC}[0m`);
    assert.equal(colorize("blue", "hello"), `${ESC}[34mhello${ESC}[0m`);
  });

  test("success applies green color and checkmark", () => {
    assert.equal(success("Done"), `${ESC}[32m${ESC}[1m✓${ESC}[0m Done`);
  });

  test("error applies red color and cross", () => {
    assert.equal(error("Failed"), `${ESC}[31m${ESC}[1m✗${ESC}[0m ${ESC}[31mFailed${ESC}[0m`);
  });

  test("warn applies yellow color and exclamation", () => {
    assert.equal(warn("Careful"), `${ESC}[33m${ESC}[1m!${ESC}[0m ${ESC}[33mCareful${ESC}[0m`);
  });

  test("info applies cyan color and arrow", () => {
    assert.equal(info("Note"), `${ESC}[36m${ESC}[1m→${ESC}[0m Note`);
  });

  test("header applies bold white color", () => {
    assert.equal(header("Title"), `${ESC}[1m${ESC}[37mTitle${ESC}[0m`);
  });

  test("dim applies dim style", () => {
    assert.equal(dim("muted"), `${ESC}[2mmuted${ESC}[0m`);
  });
});
