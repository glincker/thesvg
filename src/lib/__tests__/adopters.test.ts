import { describe, expect, it } from "vitest";
import {
  classifyPaths,
  getAdoptersHistory,
  getAdoptersSnapshot,
  type AdopterKind,
} from "../adopters";

const KINDS: AdopterKind[] = ["dependency", "code", "docs"];

describe("adopters snapshot", () => {
  const snap = getAdoptersSnapshot();

  it("matches the type shape", () => {
    expect(Number.isNaN(Date.parse(snap.generatedAt))).toBe(false);
    expect(typeof snap.method).toBe("string");
    expect(Number.isInteger(snap.total)).toBe(true);
    for (const r of snap.repos) {
      expect(r.repo).toMatch(/^[^/]+\/[^/]+$/);
      expect(r.url).toMatch(/^https:\/\/github\.com\//);
      expect(Number.isInteger(r.stars)).toBe(true);
      expect(KINDS).toContain(r.kind);
      expect(typeof r.description).toBe("string");
    }
  });

  it("has consistent totals", () => {
    const { dependency, code, docs } = snap.byKind;
    expect(dependency + code + docs).toBe(snap.total);
    expect(snap.repos.length).toBeLessThanOrEqual(snap.total);
    const listed = (k: AdopterKind) => snap.repos.filter((r) => r.kind === k).length;
    expect(listed("dependency")).toBeLessThanOrEqual(dependency);
    expect(listed("code")).toBeLessThanOrEqual(code);
    expect(listed("docs")).toBeLessThanOrEqual(docs);
  });

  it("sorts repos by stars descending without duplicates", () => {
    for (let i = 1; i < snap.repos.length; i++) {
      expect(snap.repos[i - 1].stars).toBeGreaterThanOrEqual(snap.repos[i].stars);
    }
    expect(new Set(snap.repos.map((r) => r.repo)).size).toBe(snap.repos.length);
  });
});

describe("adopters history", () => {
  const history = getAdoptersHistory();

  it("has one well-formed entry per day", () => {
    const dates = history.map((h) => h.date);
    expect(new Set(dates).size).toBe(dates.length);
    for (const h of history) {
      expect(h.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(h.byKind.dependency + h.byKind.code + h.byKind.docs).toBe(h.total);
    }
  });

  it("latest entry agrees with the snapshot", () => {
    const snap = getAdoptersSnapshot();
    const last = history[history.length - 1];
    expect(last.total).toBe(snap.total);
    expect(last.byKind).toEqual(snap.byKind);
  });
});

describe("classifyPaths", () => {
  it("prefers dependency, then code, then docs, else drops", () => {
    expect(classifyPaths(["a/README.md", "web/package.json"])).toBe("dependency");
    expect(classifyPaths(["README.md", "src/App.tsx"])).toBe("code");
    expect(classifyPaths(["docs/x.mdx"])).toBe("docs");
    expect(classifyPaths(["data/icons.json", "LICENSE"])).toBeNull();
  });
});
