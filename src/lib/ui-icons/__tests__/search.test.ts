import { describe, expect, it } from "vitest";
import { closest, rank, rankTiered, scoreEntry } from "../search";

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

describe("smarter matching", () => {
  const set = [
    { name: "trash", extra: ["bin", "delete", "remove"], weak: ["Interface"] },
    { name: "settings", extra: ["cog", "gear", "preferences"], weak: ["Tools"] },
    { name: "search", extra: ["find", "magnify"], weak: ["Tools"] },
    { name: "arrow-up", extra: ["direction"], weak: ["Arrows"] },
    { name: "bell", extra: ["notification"], weak: ["Status"] },
  ];

  it("finds an icon by a synonym that is not in its tags", () => {
    expect(rank("garbage", set, pick, 3).map((i) => i.name)).toEqual(["trash"]);
    expect(rank("config", set, pick, 3).map((i) => i.name)).toEqual(["settings"]);
  });

  it("matches plurals and -ing forms", () => {
    expect(rank("arrows", set, pick, 3).map((i) => i.name)).toEqual(["arrow-up"]);
    expect(rank("searching", set, pick, 3).map((i) => i.name)).toEqual(["search"]);
  });

  it("forgives a typo in a longer word, but not in a short one", () => {
    expect(rank("serach", set, pick, 3).map((i) => i.name)).toEqual(["search"]);
    expect(rank("setings", set, pick, 3).map((i) => i.name)).toEqual(["settings"]);
    expect(rank("blx", set, pick, 3)).toEqual([]);
    // Four letters is one edit from several other words, so there is no typo tolerance.
    expect(rank("belt", set, pick, 3)).toEqual([]);
  });

  it("ranks an exact name above a synonym and a synonym above a typo", () => {
    const mixed = [
      { name: "search", extra: [], weak: [] },
      { name: "magnifier", extra: ["lookup"], weak: [] },
      { name: "seek", extra: ["serch"], weak: [] },
    ];
    expect(rank("search", mixed, pick, 3)[0]?.name).toBe("search");
  });

  it("lets the craft score order results that matched equally", () => {
    const tied = [
      { name: "alpha", extra: ["shape"], weak: [], boost: 80 },
      { name: "alpha2", extra: ["shape"], weak: [], boost: 100 },
    ];
    expect(rank("shape", tied, pick, 2).map((i) => i.name)).toEqual(["alpha2", "alpha"]);
  });

  it("suggests the nearest word when nothing matched", () => {
    expect(closest("setings", ["settings", "search", "bell"])).toBe("settings");
    expect(closest("xyz", ["settings", "search"])).toBeNull();
  });
});

describe("ranking details", () => {
  it("puts a typo of the icon's own name above a typo of one of its tags", () => {
    const set = [
      { name: "regex", extra: ["search", "pattern"], weak: [] },
      { name: "search", extra: ["find"], weak: [] },
    ];
    expect(rank("serach", set, pick, 2).map((i) => i.name)).toEqual(["search", "regex"]);
  });

  it("finds a plural even when an unrelated tag matches it literally", () => {
    const set = [
      { name: "pointer", extra: ["arrows"], weak: [] },
      { name: "arrow-up", extra: ["direction"], weak: [] },
    ];
    expect(rank("arrows", set, pick, 2)[0]?.name).toBe("arrow-up");
  });

  it("ranks a whole word of the name above a longer word that only starts with it", () => {
    const set = [
      { name: "planet-ring", extra: [], weak: [] },
      { name: "plane-landing", extra: [], weak: [] },
    ];
    expect(rank("plane", set, pick, 2).map((i) => i.name)).toEqual(["plane-landing", "planet-ring"]);
  });
});

describe("tiered results", () => {
  const set = [
    { name: "hand", extra: ["palm"], weak: [] },
    { name: "hand-coins", extra: ["payment"], weak: [] },
    { name: "handshake", extra: ["deal"], weak: [] },
    { name: "thumbs-up", extra: ["hand", "like"], weak: [] },
    { name: "wave", extra: ["greeting"], weak: ["Hand"] },
  ];

  it("puts the strong matches first and keeps the weaker ones as related", () => {
    const { best, related } = rankTiered("hand", set, pick);
    expect(best.map((i) => i.name)).toEqual(["hand", "hand-coins", "handshake"]);
    expect(related.map((i) => i.name)).toContain("thumbs-up");
  });

  it("returns nothing in either tier when nothing matches", () => {
    expect(rankTiered("zzzzzz", set, pick)).toEqual({ best: [], related: [] });
  });

  it("never loses a result between the tiers", () => {
    const { best, related } = rankTiered("hand", set, pick);
    expect(best.length + related.length).toBe(rank("hand", set, pick, 99).length);
  });
});
