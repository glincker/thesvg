import { describe, expect, it } from "vitest";
import { iconTone, relativeLuminance } from "../icon-tone";

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns null for anything that is not a 6 digit hex", () => {
    expect(relativeLuminance(undefined)).toBeNull();
    expect(relativeLuminance("")).toBeNull();
    expect(relativeLuminance("fff")).toBeNull();
    expect(relativeLuminance("zzzzzz")).toBeNull();
  });
});

describe("iconTone", () => {
  it("flags near-black brands as dark", () => {
    expect(iconTone("000000")).toBe("dark");
    expect(iconTone("181717")).toBe("dark"); // GitHub
    expect(iconTone("#0a0a0a")).toBe("dark");
  });

  it("flags near-white brands as light", () => {
    expect(iconTone("ffffff")).toBe("light");
    expect(iconTone("f5f5f5")).toBe("light");
  });

  it("keeps coloured and mid-tone brands neutral", () => {
    expect(iconTone("4285f4")).toBe("neutral"); // Google blue
    expect(iconTone("ff9900")).toBe("neutral"); // AWS orange
    expect(iconTone("808080")).toBe("neutral");
  });

  it("falls back to neutral for missing or malformed colours", () => {
    expect(iconTone(undefined)).toBe("neutral");
    expect(iconTone("not-a-colour")).toBe("neutral");
  });
});
