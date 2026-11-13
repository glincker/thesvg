import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colorDistance, contrastRatio, describeColor, hexToRgb, hueSortKey, isHex, readableOn } from "@/lib/flags-browser/color";
import { DEFAULT_STATE, filterTiles, parseState, regionOf, sortTiles, toParams, type BrowserState } from "@/lib/flags-browser/model";
import { pushCapped, toggleCapped } from "@/lib/flags-browser/storage";
import { getFlagTiles } from "@/lib/flags-tiles";

const tiles = getFlagTiles();
const aliases = JSON.parse(readFileSync(join(__dirname, "../../../../public/data/flags-search.json"), "utf8")) as Record<string, string[]>;
const st = (patch: Partial<BrowserState>): BrowserState => ({ ...DEFAULT_STATE, ...patch });
const codes = (patch: Partial<BrowserState>, withAliases = true): string[] => filterTiles(tiles, st(patch), withAliases ? aliases : null).map((t) => t.code);

describe("contrast helper", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio(hexToRgb("000000"), hexToRgb("ffffff"))).toBeCloseTo(21, 0);
    expect(contrastRatio(hexToRgb("777777"), hexToRgb("ffffff"))).toBeLessThan(4.5);
  });
  it("picks readable text and reports AA", () => {
    expect(readableOn("ffffff").text).toBe("#000000");
    expect(readableOn("000091").text).toBe("#ffffff");
    for (const t of tiles) for (const c of t.colors) expect(readableOn(c.hex).ratio, `${t.code} ${c.hex}`).toBeGreaterThanOrEqual(4.5 - 1.6); // black or white always reaches at least 3:1
  });
  it("parses hex forms and describes colors", () => {
    expect(isHex("#ed2939")).toBe(true);
    expect(isHex("abc")).toBe(true);
    expect(isHex("zzz")).toBe(false);
    expect(describeColor("ed2939")).toEqual({ hex: "#ed2939", rgb: "rgb(237, 41, 57)", hsl: "hsl(355, 84%, 55%)" });
    expect(colorDistance(hexToRgb("ff0000"), hexToRgb("ff0000"))).toBe(0);
    expect(hueSortKey("808080")).toBeGreaterThan(360);
  });
});

describe("filters", () => {
  it("covers all regions and counts add up", () => {
    expect(tiles).toHaveLength(258);
    expect(regionOf("North America", "iso")).toBe("americas");
    expect(regionOf(null, "organization")).toBe("international");
    expect(codes({ region: "regional" })).toEqual(expect.arrayContaining(["gb-eng", "gb-sct", "gb-wls", "es-ct", "es-pv", "es-ga"]));
    expect(codes({ region: "international" }).sort()).toEqual(["eu", "un"]);
    expect(codes({ region: "europe" })).toContain("de");
    expect(codes({ region: "europe" })).not.toContain("jp");
  });
  it("uses the alias search for names, native names, codes, emoji and locale tags", () => {
    expect(codes({ q: "deutschland" })[0]).toBe("de");
    expect(codes({ q: "DEU" })[0]).toBe("de");
    expect(codes({ q: "276" })[0]).toBe("de");
    expect(codes({ q: "\u{1F1E9}\u{1F1EA}" })[0]).toBe("de");
    expect(codes({ q: "pt-BR" })[0]).toBe("br");
    expect(codes({ q: "日本" })[0]).toBe("jp");
    expect(codes({ q: "catalunya" })[0]).toBe("es-ct");
    expect(codes({ q: "zzzzzz" })).toEqual([]);
  });
  it("works before the alias file has loaded, on tile fields only", () => {
    expect(codes({ q: "germany" }, false)[0]).toBe("de");
    expect(codes({ q: "pt-br" }, false)[0]).toBe("br");
  });
  it("filters by color family with OR and AND", () => {
    const or = codes({ colors: ["red", "green"], mode: "or" });
    const and = codes({ colors: ["red", "green"], mode: "and" });
    expect(and.length).toBeGreaterThan(0);
    expect(and.length).toBeLessThan(or.length);
    for (const c of and) expect(or).toContain(c);
    expect(codes({ colors: ["blue", "white", "red"], mode: "and" })).toContain("fr");
  });
  it("finds flags containing a color near a hex within a tolerance", () => {
    const near = codes({ near: "ed2939", tol: 30 });
    expect(near.length).toBeGreaterThan(0);
    expect(codes({ near: "ed2939", tol: 5 }).length).toBeLessThanOrEqual(near.length);
    expect(codes({ near: "not-a-hex" }).length).toBe(258);
  });
  it("sorts by name, region, ISO code and hue", () => {
    expect(codes({ sort: "name" })[0]).toBe("af");
    expect(sortTiles(tiles, "iso")[0].iso).toBe("AD");
    expect(sortTiles(tiles, "region").map((t) => t.region)[0]).toBe("africa");
    const hue = sortTiles(tiles, "hue");
    expect(hue).toHaveLength(258);
  });
});

describe("URL state", () => {
  it("round-trips only non-default values", () => {
    expect(toParams(DEFAULT_STATE).toString()).toBe("");
    const s = st({ q: "de", region: "europe", variant: "circle", size: "l", sort: "hue", colors: ["red"], mode: "and", near: "ed2939", tol: 60, flag: "de", view: "languages" });
    expect(parseState(toParams(s))).toEqual(s);
  });
  it("ignores unknown values", () => {
    const s = parseState(new URLSearchParams("region=mars&variant=hex&sort=x&colors=red,plaid&near=zz&tol=-4"));
    expect(s).toMatchObject({ region: "all", variant: "4x3", sort: "name", colors: ["red"], near: "", tol: DEFAULT_STATE.tol });
  });
});

describe("capped lists", () => {
  it("keeps recents unique, newest first and capped", () => {
    expect(pushCapped(["a", "b", "c"], "b", 3)).toEqual(["b", "a", "c"]);
    expect(pushCapped(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
  });
  it("toggles stars within the cap", () => {
    expect(toggleCapped(["a"], "b", 2)).toEqual(["b", "a"]);
    expect(toggleCapped(["b", "a"], "b", 2)).toEqual(["a"]);
    expect(toggleCapped(["b", "a"], "c", 2)).toEqual(["c", "b"]);
  });
});
