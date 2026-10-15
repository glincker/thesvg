import { describe, expect, it } from "vitest";
import { getIconLinks } from "@/lib/icon-links";

describe("getIconLinks", () => {
  it("returns nothing when there are no links", () => {
    expect(getIconLinks(undefined)).toEqual([]);
    expect(getIconLinks({})).toEqual([]);
  });

  it("orders code first, then docs, then community and social", () => {
    const out = getIconLinks({
      x: "https://x.com/example",
      docs: "https://docs.example.com",
      github: "https://github.com/example/example",
      discord: "https://discord.gg/abc",
    });
    expect(out.map((l) => l.type)).toEqual(["github", "docs", "discord", "x"]);
  });

  it("drops non-https, unparseable and wrong-host links", () => {
    const out = getIconLinks({
      github: "http://github.com/example/example",
      gitlab: "https://evil.example.com/example",
      x: "not a url",
      youtube: "https://www.youtube.com/@example",
    });
    expect(out.map((l) => l.type)).toEqual(["youtube"]);
  });

  it("accepts www and subdomain hosts of the allowed domain", () => {
    const out = getIconLinks({ github: "https://www.github.com/example/example" });
    expect(out).toHaveLength(1);
  });

  it("allows any https host for docs and mastodon", () => {
    const out = getIconLinks({
      docs: "https://docs.example.org/guide",
      mastodon: "https://fosstodon.org/@example",
    });
    expect(out.map((l) => l.type)).toEqual(["docs", "mastodon"]);
  });
});
