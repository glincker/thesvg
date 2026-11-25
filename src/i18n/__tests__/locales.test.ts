import { describe, expect, it } from "vitest";
import en from "@/locales/en.json";
import { LOCALES, matchLocale } from "../locales";

function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === "object" ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

function placeholders(s: string): string[] {
  return (s.match(/\{\{\w+\}\}/g) ?? []).sort();
}

function lookup(obj: Record<string, unknown>, path: string): string {
  return path.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)[k], obj) as string;
}

describe("locale files", () => {
  const enKeys = keyPaths(en);

  for (const { code } of LOCALES.filter((l) => l.code !== "en")) {
    it(`${code} has the same keys and placeholders as en`, async () => {
      const mod = (await import(`@/locales/${code}.json`)) as { default: Record<string, unknown> };
      expect(keyPaths(mod.default).sort()).toEqual([...enKeys].sort());
      for (const path of enKeys) {
        const value = lookup(mod.default, path);
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
        expect(placeholders(value)).toEqual(placeholders(lookup(en, path)));
      }
    });
  }
});

describe("matchLocale", () => {
  it("matches exact and base tags", () => {
    expect(matchLocale("fr-CA")).toBe("fr");
    expect(matchLocale("pt-PT")).toBe("pt-BR");
    expect(matchLocale("zh-Hans-CN")).toBe("zh-CN");
    expect(matchLocale("ja")).toBe("ja");
  });
  it("returns null for unsupported or empty tags", () => {
    expect(matchLocale("sv")).toBeNull();
    expect(matchLocale("")).toBeNull();
    expect(matchLocale(undefined)).toBeNull();
  });
});
