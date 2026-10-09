import { describe, expect, it } from "vitest";
import { formatStarCount, parseStarCount } from "../github-stars";

describe("formatStarCount", () => {
  it("leaves small numbers alone", () => {
    expect(formatStarCount(0)).toBe("0");
    expect(formatStarCount(987)).toBe("987");
  });

  it("abbreviates thousands with one decimal below 10k", () => {
    expect(formatStarCount(1000)).toBe("1k");
    expect(formatStarCount(1234)).toBe("1.2k");
    expect(formatStarCount(9999)).toBe("9.9k");
  });

  it("drops the decimal from 10k up", () => {
    expect(formatStarCount(12_345)).toBe("12k");
    expect(formatStarCount(999_999)).toBe("999k");
  });

  it("handles millions and bad input", () => {
    expect(formatStarCount(1_250_000)).toBe("1.2m");
    expect(formatStarCount(-1)).toBe("");
    expect(formatStarCount(Number.NaN)).toBe("");
  });
});

describe("parseStarCount", () => {
  it("reads stargazers_count", () => {
    expect(parseStarCount({ stargazers_count: 4210 })).toBe(4210);
  });

  it("rejects anything else", () => {
    expect(parseStarCount(null)).toBeNull();
    expect(parseStarCount({})).toBeNull();
    expect(parseStarCount({ stargazers_count: "12" })).toBeNull();
    expect(parseStarCount({ stargazers_count: -3 })).toBeNull();
  });
});
