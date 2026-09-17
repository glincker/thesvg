import { describe, it, expect } from "vitest";
import {
  textResult,
  errorResult,
  iconNotFoundResult,
  findIconOrNotFound,
} from "./tool-helpers";

describe("textResult", () => {
  it("wraps text in a single text content block with no error flag", () => {
    expect(textResult("hello")).toEqual({
      content: [{ type: "text", text: "hello" }],
    });
  });
});

describe("errorResult", () => {
  it("wraps text in a text content block and sets isError", () => {
    expect(errorResult("oops")).toEqual({
      content: [{ type: "text", text: "oops" }],
      isError: true,
    });
  });
});

describe("iconNotFoundResult", () => {
  it("builds a consistent not-found message referencing the slug", () => {
    const result = iconNotFoundResult("nope");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('"nope"');
    expect(result.content[0].text).toContain("search_icons");
  });
});

describe("findIconOrNotFound", () => {
  it("returns ok:true with the icon for a known slug", () => {
    const found = findIconOrNotFound("github");
    expect(found.ok).toBe(true);
    if (found.ok) {
      expect(found.icon.slug).toBe("github");
    }
  });

  it("returns ok:false with a not-found result for an unknown slug", () => {
    const found = findIconOrNotFound("this-slug-does-not-exist");
    expect(found.ok).toBe(false);
    if (!found.ok) {
      expect(found.result.isError).toBe(true);
      expect(found.result.content[0].text).toContain(
        "this-slug-does-not-exist"
      );
    }
  });
});
