import { describe, expect, it } from "vitest";
import { rank, scoreEntry } from "../search";

const items = [
  { name: "home", extra: ["house", "start"], weak: ["Home"] },
  { name: "home-assistant", extra: ["smart"], weak: [] },
  { name: "house", extra: ["home", "building"], weak: ["Home"] },
  { name: "compass", extra: ["navigate", "map"], weak: ["Home"] },
  { name: "newspaper", extra: ["news", "article"], weak: [] },
];
const pick = (i: (typeof items)[number]) => i;

describe("ui icon search", () => {
  it("puts an exact name first, then the shorter name", () => {
    expect(rank("home", items, pick, 5).map((i) => i.name).slice(0, 2)).toEqual(["home", "home-assistant"]);
  });

  it("finds icons by tag", () => {
    expect(rank("navigate", items, pick, 5).map((i) => i.name)).toEqual(["compass"]);
  });

  it("lets a tag outrank a broad category label", () => {
    const names = rank("home", items, pick, 5).map((i) => i.name);
    expect(names.indexOf("house")).toBeLessThan(names.indexOf("compass"));
  });

  it("requires every word of the query to match", () => {
    expect(rank("start navigate", items, pick, 5)).toEqual([]);
  });

  it("finds a short name from letters in order but not a long one", () => {
    expect(rank("nws", items, pick, 5).map((i) => i.name)).toEqual(["newspaper"]);
    expect(scoreEntry("upload", { name: "an unrelated long and winding title", extra: [] })).toBe(0);
  });

  it("respects the limit and ignores an empty query", () => {
    expect(rank("home", items, pick, 1)).toHaveLength(1);
    expect(rank("   ", items, pick, 5)).toEqual([]);
  });
});
