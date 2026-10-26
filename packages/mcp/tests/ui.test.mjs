// Runs against the built server (npm run build first). Spawns dist/index.js
// over stdio with a stubbed fetch, so it exercises the real tool schemas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverPath = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const stubPath = fileURLToPath(new URL("./stub-fetch.mjs", import.meta.url));

async function withServer(ui, run) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", stubPath, serverPath],
    env: { ...process.env, THESVG_TEST_UI: ui },
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(transport);
  try {
    return await run(client);
  } finally {
    await client.close();
  }
}

const textOf = (r) => r.content.map((c) => c.text).join("\n");

test("kind defaults to brand: existing calls are unchanged", async () => {
  await withServer("ok", async (client) => {
    const search = await client.callTool({
      name: "search_icons",
      arguments: { query: "github" },
    });
    assert.ok(!search.isError);
    assert.match(textOf(search), /slug: `github`/);

    const explicit = await client.callTool({
      name: "search_icons",
      arguments: { query: "github", kind: "brand" },
    });
    assert.equal(textOf(explicit), textOf(search));

    const get = await client.callTool({
      name: "get_icon",
      arguments: { slug: "github" },
    });
    assert.match(textOf(get), /\*\*Brand color\*\*/);
    assert.match(textOf(get), /data-brand/);

    const cats = await client.callTool({ name: "list_categories", arguments: {} });
    assert.match(textOf(cats), /categories across \d+ icons/);
  });
});

test("kind ui searches, gets the right look and lists categories", async () => {
  await withServer("ok", async (client) => {
    const found = await client.callTool({
      name: "search_icons",
      arguments: { query: "arrow", kind: "ui" },
    });
    assert.match(textOf(found), /arrow-down/);

    const def = await client.callTool({
      name: "get_icon",
      arguments: { slug: "arrow-down", kind: "ui" },
    });
    assert.match(textOf(def), /data-look="outline"/);

    const glass = await client.callTool({
      name: "get_icon",
      arguments: { slug: "arrow-down", kind: "ui", look: "glass" },
    });
    assert.match(textOf(glass), /data-look="glass"/);
    assert.match(textOf(glass), /thesvg\.org\/ui\/arrow-down\/glass\.svg/);

    const bad = await client.callTool({
      name: "get_icon",
      arguments: { slug: "arrow-down", kind: "ui", look: "neon" },
    });
    assert.equal(bad.isError, true);
    assert.match(textOf(bad), /Valid looks: outline, glass/);

    const cats = await client.callTool({
      name: "list_categories",
      arguments: { kind: "ui" },
    });
    assert.match(textOf(cats), /\*\*Arrows\*\* - 2 icons/);
  });
});

test("UI fetch failure returns a clear error and leaves brand working", async () => {
  await withServer("down", async (client) => {
    const ui = await client.callTool({
      name: "search_icons",
      arguments: { query: "arrow", kind: "ui" },
    });
    assert.equal(ui.isError, true);
    assert.match(textOf(ui), /UI icons are unavailable/);

    const brand = await client.callTool({
      name: "search_icons",
      arguments: { query: "github" },
    });
    assert.ok(!brand.isError);
    assert.match(textOf(brand), /slug: `github`/);

    const brandGet = await client.callTool({
      name: "get_icon",
      arguments: { slug: "github" },
    });
    assert.ok(!brandGet.isError);
  });
});
