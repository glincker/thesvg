import { describe, expect, it } from "vitest";
import { iconTone, relativeLuminance, toneFromSvg } from "../icon-tone";

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

describe("toneFromSvg", () => {
  const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`;

  it("treats unpainted shapes as black", () => {
    expect(toneFromSvg(svg('<path d="M0 0h24v24H0z"/>'))).toBe("dark");
  });

  it("flags artwork painted only in near-black or near-white", () => {
    expect(toneFromSvg(svg('<path fill="#181717" d="M0 0"/>'))).toBe("dark");
    expect(toneFromSvg(svg('<path fill="#fff" d="M0 0"/><circle fill="white" r="2"/>'))).toBe("light");
  });

  it("keeps colourful and mixed artwork neutral", () => {
    expect(toneFromSvg(svg('<path fill="#4285f4" d="M0 0"/><path fill="#ea4335" d="M1 1"/>'))).toBe("neutral");
    // white square behind a black mark that has no fill of its own
    expect(toneFromSvg(svg('<rect fill="#fff" width="24" height="24"/><path d="M4 4h16v16H4z"/>'))).toBe("neutral");
  });

  it("ignores clip paths and does not let a registry-style black override real colours", () => {
    expect(toneFromSvg(svg('<defs><clipPath id="a"><rect width="24" height="24"/></clipPath></defs><g clip-path="url(#a)"><path fill="#fff" d="M0 0"/></g>'))).toBe("light");
  });

  it("respects fill inherited from the svg or a group", () => {
    expect(toneFromSvg('<svg fill="#fff" viewBox="0 0 24 24"><path d="M0 0"/></svg>')).toBe("light");
  });

  it("returns neutral when there is no shape at all", () => {
    expect(toneFromSvg("<svg></svg>")).toBe("neutral");
  });
});
