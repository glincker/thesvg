import { test, describe, beforeEach, afterEach, mock } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runAdd, parseAddArgs } from "../../src/commands/add.ts";
import { parseListArgs } from "../../src/commands/list.ts";
import { parseSearchArgs } from "../../src/commands/search.ts";
import { fetchIconList, __resetCachedRegistryForTest } from "../../src/utils/api.ts";
import {
  fetchUiIconList,
  __resetCachedUiIndexForTest,
  __resetUiLookCacheForTest,
} from "../../src/utils/ui.ts";

const fixture = await readFile(
  new URL("../fixtures/ui-icons.json", import.meta.url),
  "utf-8"
);

const BRAND_REGISTRY = {
  total: 1,
  icons: [
    {
      slug: "github",
      title: "GitHub",
      aliases: [],
      categories: ["Dev"],
      hex: "181717",
      url: null,
      license: "MIT",
      variants: ["default"],
    },
  ],
};

const originalFetch = global.fetch;
let outDir: string;
let exitMock: ReturnType<typeof mock.method>;
let errors: string[];

function jsonResponse(body: unknown): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status: 200,
  });
}

function installFetch(opts: { uiDown?: boolean } = {}): string[] {
  const urls: string[] = [];
  global.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    urls.push(url);
    if (url.endsWith("/api/registry.json")) return jsonResponse(BRAND_REGISTRY);
    if (opts.uiDown && url.includes("/src/data/ui-icons.json")) {
      throw new Error("ECONNREFUSED");
    }
    if (url.endsWith("/src/data/ui-icons.json")) return jsonResponse(fixture);
    if (url.includes("/src/data/ui/looks/")) {
      const look = /\/looks\/([^/]+)\.json$/.exec(url)?.[1] ?? "";
      const body: Record<string, string> = {};
      for (const icon of (JSON.parse(fixture) as { icons: { slug: string }[] }).icons) body[icon.slug] = `<svg data-slug="${icon.slug}" data-look="${look}"/>`;
      return jsonResponse(body);
    }
    return new Response("", { status: 404 });
  }) as typeof fetch;
  return urls;
}

beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), "thesvg-ui-"));
  __resetCachedRegistryForTest();
  __resetCachedUiIndexForTest();
  __resetUiLookCacheForTest();
  errors = [];
  exitMock = mock.method(process, "exit", (code: number) => {
    throw new Error(`exit ${code}`);
  });
  mock.method(console, "log", () => {});
  mock.method(console, "warn", () => {});
  mock.method(console, "error", (...a: unknown[]) => {
    errors.push(a.join(" "));
  });
});

afterEach(async () => {
  global.fetch = originalFetch;
  mock.restoreAll();
  await rm(outDir, { recursive: true, force: true });
});

describe("thesvg add ui:<slug>", () => {
  test("writes the outline look by default", async () => {
    const urls = installFetch();
    await runAdd(["ui:arrow-down", "--dir", outDir]);
    const files = await readdir(outDir);
    assert.deepEqual(files, ["arrow-down.svg"]);
    const body = await readFile(join(outDir, "arrow-down.svg"), "utf-8");
    assert.match(body, /data-look="outline"/);
    assert.ok(urls.some((u) => u.endsWith("/src/data/ui/looks/outline.json")));
  });

  test("writes the requested look", async () => {
    installFetch();
    await runAdd(["ui:arrow-down", "--look", "glass", "--dir", outDir]);
    const body = await readFile(join(outDir, "arrow-down-glass.svg"), "utf-8");
    assert.match(body, /data-look="glass"/);
  });

  test("rejects an unknown look and lists valid ones", async () => {
    installFetch();
    await assert.rejects(
      runAdd(["ui:arrow-down", "--look", "neon", "--dir", outDir]),
      /exit 1/
    );
    const msg = errors.join("\n");
    assert.match(msg, /Unknown look "neon"/);
    assert.match(msg, /outline, glass, duotone, offset, fill, pixel, depth/);
    assert.deepEqual(await readdir(outDir), []);
  });

  test("brand args parse exactly as before (no look key)", () => {
    assert.deepEqual(parseAddArgs(["github"]), {
      slugs: ["github"],
      variant: "default",
      dir: undefined,
      format: "svg",
    });
  });
});

describe("list --ui and search --ui", () => {
  test("list --ui filters by category", async () => {
    installFetch();
    assert.equal(parseListArgs(["--ui"]).ui, true);
    const { icons, total } = await fetchUiIconList({ category: "arrows" });
    assert.equal(total, 2);
    assert.deepEqual(icons.map((i) => i.slug).sort(), ["arrow-down", "arrow-left"]);
  });

  test("search --ui matches tags and defaults to brand without the flag", async () => {
    installFetch();
    assert.equal(parseSearchArgs(["arrow", "--ui"]).ui, true);
    assert.equal(parseSearchArgs(["arrow"]).ui, undefined);
    assert.equal(parseListArgs([]).ui, undefined);
    const { icons } = await fetchUiIconList({ query: "radio" });
    assert.deepEqual(icons.map((i) => i.slug), ["antenna"]);
  });
});

describe("UI fetch failure", () => {
  test("fails soft for UI and leaves brand calls working", async () => {
    installFetch({ uiDown: true });
    await assert.rejects(fetchUiIconList(), /UI icons are unavailable/);
    const brand = await fetchIconList();
    assert.equal(brand.total, 1);
    assert.equal(brand.icons[0]?.slug, "github");
    assert.equal(exitMock.mock.callCount(), 0);
  });
});
