import { describe, expect, it } from "vitest";
import { DEFAULT_QUALITY_CONFIG, describePart, medianOf, qualityConfigFromEnv, scoreQuality, type Measurements } from "../quality";

const cfg = DEFAULT_QUALITY_CONFIG;
const good: Measurements = { minX: 3, maxX: 21, minY: 3, maxY: 21, length: 60, looksOk: 7, looks: 7 };
const meta = { tags: ["a", "b", "c", "d"], category: "Arrows" };

describe("scoreQuality", () => {
  it("gives a well drawn, well described icon full marks", () => {
    expect(scoreQuality(meta, good, 60, cfg)).toEqual({ total: 100, parts: [25, 25, 25, 25] });
  });

  it("takes points off an icon that crosses the live area", () => {
    const { parts } = scoreQuality(meta, { ...good, minX: -1 }, 60, cfg);
    expect(parts[0]).toBeLessThan(25);
  });

  it("takes points off an icon that sits off center", () => {
    const { parts } = scoreQuality(meta, { ...good, minX: 1, maxX: 13, minY: 1, maxY: 13 }, 60, cfg);
    expect(parts[0]).toBeLessThan(25);
  });

  it("scores looks by how many render", () => {
    expect(scoreQuality(meta, { ...good, looksOk: 6 }, 60, cfg).parts[1]).toBeCloseTo(21.4, 1);
  });

  it("only penalizes visual weight outside the band around the set median", () => {
    expect(scoreQuality(meta, { ...good, length: 90 }, 60, cfg).parts[2]).toBe(25);
    expect(scoreQuality(meta, { ...good, length: 10 }, 60, cfg).parts[2]).toBeLessThan(25);
    expect(scoreQuality(meta, { ...good, length: 200 }, 60, cfg).parts[2]).toBeLessThan(25);
  });

  it("scores metadata on tags and a real category", () => {
    expect(scoreQuality({ tags: ["a", "b"], category: "Arrows" }, good, 60, cfg).parts[3]).toBe(20);
    expect(scoreQuality({ tags: ["a", "b"], category: "General" }, good, 60, cfg).parts[3]).toBe(10);
    expect(scoreQuality({ tags: ["a"], category: "General" }, good, 60, cfg).parts[3]).toBe(0);
  });

  it("never produces points outside 0 to 25 per part", () => {
    const { parts } = scoreQuality({ tags: [], category: "General" }, { ...good, minX: -50, maxX: 80, looksOk: 0 }, 60, cfg);
    for (const p of parts) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(25);
    }
  });
});

describe("qualityConfigFromEnv", () => {
  it("uses the defaults when nothing is set", () => {
    expect(qualityConfigFromEnv({})).toEqual(cfg);
  });

  it("reads overrides and ignores values that are not numbers", () => {
    const c = qualityConfigFromEnv({ UI_QUALITY_MIN_SCORE: "85", UI_QUALITY_LIVE_MAX: "nope" });
    expect(c.minScore).toBe(85);
    expect(c.liveMax).toBe(cfg.liveMax);
  });
});

describe("helpers", () => {
  it("finds the median of odd and even lists", () => {
    expect(medianOf([3, 1, 2])).toBe(2);
    expect(medianOf([4, 1, 3, 2])).toBe(2.5);
    expect(medianOf([])).toBe(0);
  });

  it("describes a part differently when it is not full", () => {
    expect(describePart(0, 25)).not.toBe(describePart(0, 10));
  });
});
