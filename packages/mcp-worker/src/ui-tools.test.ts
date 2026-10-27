import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fixture from "./fixtures/ui-icons.json";
import { resetUiCachesForTests, UI_INDEX_URL } from "./ui-data";
import { uiCategories, uiGet, uiSearch, uiUrl } from "./ui-tools";
import { slugAndVariantSchema } from "./tool-schemas";
import { searchIcons, resetCachesForTests } from "./icons-data";

function stubFetch(opts: { uiDown?: boolean } = {}) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      calls.push(url);
      if (url === UI_INDEX_URL) {
        if (opts.uiDown) throw new Error("ECONNREFUSED");
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      const m = /\/ui\/([^/]+)\/([^/]+)\.svg$/.exec(url);
      if (m) return new Response(`<svg data-look="${m[2]}"/>`, { status: 200 });
      return new Response("", { status: 404 });
    })
  );
  return calls;
}

const textOf = (r: { content: { text: string }[] }) =>
  r.content.map((c) => c.text).join("\n");

beforeEach(() => {
  resetUiCachesForTests();
  resetCachesForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("kind defaults", () => {
  it("leaves the brand slug/variant schema output unchanged", () => {
    expect(slugAndVariantSchema("d").parse({ slug: "github" })).toEqual({
      slug: "github",
      variant: "default",
    });
  });
});

describe("UI tools", () => {
  it("get returns the requested look and defaults to outline via the URL", async () => {
    const calls = stubFetch();
    const glass = await uiGet("arrow-down", "glass");
    expect(glass.isError).toBeUndefined();
    expect(textOf(glass)).toContain('data-look="glass"');
    expect(calls.some((u) => u.endsWith("/ui/arrow-down/glass.svg"))).toBe(true);

    const outline = await uiGet("arrow-down", "outline");
    expect(textOf(outline)).toContain('data-look="outline"');
  });

  it("rejects an unknown look and lists the valid ones", async () => {
    stubFetch();
    const res = await uiUrl("arrow-down", "neon");
    expect(res.isError).toBe(true);
    expect(textOf(res)).toContain("outline, glass, duotone, offset, fill, glass-outline, depth");
  });

  it("searches by tag and lists categories", async () => {
    stubFetch();
    const found = await uiSearch("radio", 5);
    expect(textOf(found)).toContain("antenna");
    expect(textOf(await uiCategories())).toContain("**Arrows** - 2 icons");
  });

  it("caches the index after the first fetch", async () => {
    const calls = stubFetch();
    await uiSearch("arrow", 5);
    await uiSearch("pulse", 5);
    expect(calls.filter((u) => u === UI_INDEX_URL)).toHaveLength(1);
  });
});

describe("UI fetch failure", () => {
  it("returns a clear error for UI and leaves brand search working", async () => {
    stubFetch({ uiDown: true });
    const ui = await uiSearch("arrow", 5);
    expect(ui.isError).toBe(true);
    expect(textOf(ui)).toContain("UI icons are unavailable");

    expect(searchIcons("github", 3).some((r) => r.slug === "github")).toBe(true);
  });
});
