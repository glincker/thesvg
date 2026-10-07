import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface Post {
  slug: string;
}

const ROOT = join(__dirname, "../../..");
const posts = JSON.parse(readFileSync(join(ROOT, "src/data/posts.json"), "utf-8")) as Post[];
const feed = readFileSync(join(ROOT, "public/feed.xml"), "utf-8");

describe("public/feed.xml", () => {
  it("has an item for every blog post (run `pnpm generate:feed` if this fails)", () => {
    const missing = posts
      .map((post) => post.slug)
      .filter((slug) => !feed.includes(`<guid isPermaLink="true">https://thesvg.org/blog/${slug}</guid>`));
    expect(missing).toEqual([]);
  });

  it("does not list a post twice", () => {
    const guids = [...feed.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map((m) => m[1]);
    expect(new Set(guids).size).toBe(guids.length);
  });
});
