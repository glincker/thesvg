import { describe, expect, it } from "vitest";
import { roundDownToHundred } from "@/lib/icons";

describe("roundDownToHundred", () => {
  it("rounds down so an N+ label is never an overstatement", () => {
    expect(roundDownToHundred(7554)).toBe(7500);
    expect(roundDownToHundred(7599)).toBe(7500);
    expect(roundDownToHundred(7600)).toBe(7600);
  });

  it("leaves small values sensible", () => {
    expect(roundDownToHundred(99)).toBe(0);
    expect(roundDownToHundred(100)).toBe(100);
  });
});
