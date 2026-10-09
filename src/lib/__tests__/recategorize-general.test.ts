import { describe, expect, it } from "vitest";
import icons from "@/data/icons.json";
import {
  RULES,
  applyMoves,
  planMoves,
  resolve,
  stripVendor,
  type IconEntry,
  type Rule,
} from "../../../scripts/recategorize-general";

const entries = icons as IconEntry[];
const existing = new Set(entries.flatMap((i) => i.categories));

describe("recategorize-general rule table", () => {
  it("keeps General as an existing category", () => {
    expect(existing.has("General")).toBe(true);
  });

  it("has unique rule ids and a reason for each rule", () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RULES) expect(r.reason.trim().length).toBeGreaterThan(0);
  });

  it("only targets categories that already exist and never General", () => {
    for (const r of RULES) {
      expect(r.categories.length, r.id).toBeGreaterThan(0);
      for (const c of r.categories) {
        expect(existing.has(c), `${r.id} -> ${c}`).toBe(true);
        expect(c).not.toBe("General");
      }
    }
  });

  it("every rule matches at least one icon (no dead rules)", () => {
    for (const r of RULES) {
      const hit = entries.some(
        (i) => r.domain.test(i.url) && r.name.test(stripVendor(i.slug)),
      );
      expect(hit, r.id).toBe(true);
    }
  });

  it("never produces an empty category list", () => {
    for (const m of planMoves(entries)) expect(m.to.length, m.slug).toBeGreaterThan(0);
  });
});

describe("resolve", () => {
  const base: IconEntry = {
    slug: "azure-thing",
    title: "Thing",
    categories: ["General"],
    url: "https://azure.microsoft.com/x",
  };
  const mk = (id: string, categories: string[]): Rule => ({
    id,
    reason: "test",
    domain: /azure/,
    name: /^thing$/,
    categories,
  });

  it("leaves icons without General alone", () => {
    expect(resolve({ ...base, categories: ["AI"] }, [mk("a", ["Storage"])])).toBeNull();
  });

  it("leaves icons with no matching rule alone", () => {
    expect(resolve({ ...base, slug: "azure-other" }, [mk("a", ["Storage"])])).toBeNull();
  });

  it("skips icons whose rules disagree", () => {
    expect(resolve(base, [mk("a", ["Storage"]), mk("b", ["Networking"])])).toBeNull();
  });

  it("replaces General and keeps other existing categories", () => {
    const r = resolve({ ...base, categories: ["Identity", "General"] }, [mk("a", ["Identity"])]);
    expect(r?.to).toEqual(["Identity"]);
    const s = resolve(base, [mk("a", ["Storage", "Database"])]);
    expect(s?.to).toEqual(["Storage", "Database"]);
  });
});

describe("applyMoves", () => {
  it("rewrites only the categories block of moved icons", () => {
    const raw = [
      "[",
      "  {",
      '    "slug": "a",',
      '    "categories": [',
      '      "General"',
      "    ],",
      '    "url": "x"',
      "  },",
      "  {",
      '    "slug": "b",',
      '    "categories": [',
      '      "General"',
      "    ],",
      '    "url": "y"',
      "  }",
      "]",
      "",
    ].join("\n");
    const out = applyMoves(raw, [
      { slug: "b", title: "B", from: ["General"], to: ["Storage", "Database"], rules: ["t"] },
    ]);
    const parsed = JSON.parse(out) as { categories: string[] }[];
    expect(parsed[0].categories).toEqual(["General"]);
    expect(parsed[1].categories).toEqual(["Storage", "Database"]);
    expect(out.split("\n").length).toBe(raw.split("\n").length + 1);
  });
});
