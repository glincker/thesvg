import { describe, expect, it } from "vitest";
import { chromeLook } from "../chrome-look";

describe("chromeLook", () => {
  it("uses the crisp glass outline from 16px, and frosted glass from 24px", () => {
    expect(chromeLook("size-4")).toBe("glass-outline");
    expect(chromeLook("h-5 w-5")).toBe("glass-outline");
    expect(chromeLook("size-6")).toBe("glass");
    expect(chromeLook("size-7 text-foreground")).toBe("glass");
  });

  it("falls back to outline below 16px", () => {
    expect(chromeLook("size-3.5")).toBe("outline");
    expect(chromeLook("h-3 w-3 text-muted-foreground")).toBe("outline");
  });

  it("treats a class with no size as the 16px default", () => {
    expect(chromeLook("text-orange-500")).toBe("glass-outline");
  });
});
