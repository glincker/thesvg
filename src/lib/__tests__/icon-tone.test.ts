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

  it("ignores paint that only exists inside a clip path or mask", () => {
    const clipped = svg(
      '<defs><clipPath id="a"><rect fill="#000" width="24" height="24"/></clipPath></defs>' +
        '<g clip-path="url(#a)"><path fill="#fff" d="M0 0"/></g>',
    );
    expect(toneFromSvg(clipped)).toBe("light");
  });

  it("respects fill inherited from the svg or a group", () => {
    expect(toneFromSvg('<svg fill="#fff" viewBox="0 0 24 24"><path d="M0 0"/></svg>')).toBe("light");
  });

  it("resolves inherited fill per shape, not once for the whole file", () => {
    // the second path sits outside the group and is the default black
    expect(toneFromSvg(svg('<g fill="#fff"><path d="M0 0"/></g><path d="M1 1"/>'))).toBe("neutral");
    expect(toneFromSvg(svg('<g fill="#fff"><path d="M0 0"/></g>'))).toBe("light");
  });

  it("does not drop named colours", () => {
    // a white mark plus a red one is colourful, not white-only
    expect(toneFromSvg(svg('<path fill="#FFF" d="M0 0"/><path fill="red" d="M1 1"/>'))).toBe("neutral");
    expect(toneFromSvg(svg('<path fill="black" d="M0 0"/><path fill="gray" d="M1 1"/>'))).toBe("neutral");
  });

  it("reads gradient stops when a shape uses a gradient", () => {
    const grad =
      '<defs><linearGradient id="g"><stop stop-color="#12CD87"/><stop stop-color="#0E9FD8"/></linearGradient></defs>' +
      '<path fill="url(#g)" d="M0 0"/>';
    expect(toneFromSvg(svg(grad))).toBe("neutral");
  });

  it("returns neutral when there is no shape at all", () => {
    expect(toneFromSvg("<svg></svg>")).toBe("neutral");
  });
});
