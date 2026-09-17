import { describe, it, expect } from "vitest";
import { slugAndVariantSchema, SLUG_DESCRIPTION } from "./tool-schemas";

describe("slugAndVariantSchema", () => {
  it("requires a slug and defaults variant to 'default'", () => {
    const schema = slugAndVariantSchema("some variant description");
    const parsed = schema.parse({ slug: "github" });
    expect(parsed).toEqual({ slug: "github", variant: "default" });
  });

  it("accepts an explicit variant", () => {
    const schema = slugAndVariantSchema("some variant description");
    const parsed = schema.parse({ slug: "github", variant: "mono" });
    expect(parsed.variant).toBe("mono");
  });

  it("rejects a missing slug", () => {
    const schema = slugAndVariantSchema("some variant description");
    expect(() => schema.parse({})).toThrow();
  });

  it("uses the same slug description across callers", () => {
    expect(SLUG_DESCRIPTION).toContain("search_icons");
  });
});
