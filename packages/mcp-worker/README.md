# @thesvg/mcp-worker

Remote HTTPS MCP (Model Context Protocol) server for [thesvg.org](https://thesvg.org), deployed as a standalone Cloudflare Worker.

This is the HTTPS-reachable sibling of [`packages/mcp`](../mcp), which is a stdio-only server used by Claude Desktop, Cursor, and Claude Code via `npx`. ChatGPT Apps connectors and Claude.ai's web "custom connectors" both require a server reachable over HTTPS rather than stdio, hence this separate package and separate deployment.

The two servers are not meant to share code. They accept drifting apart over time (different runtimes, different transports) in exchange for each staying simple.

## What it does

Exposes the same five tools as `packages/mcp`, adapted for the edge runtime:

| Tool | Description |
|------|-------------|
| `search_icons` | Fuzzy search icons by brand name, slug, or alias. Also returns an embedded HTML widget (a thumbnail grid) for MCP UI-aware clients such as ChatGPT. |
| `get_icon` | Fetch raw SVG markup + metadata for a specific icon variant |
| `list_variants` | List available variants for a specific icon |
| `get_icon_url` | Get a `thesvg.org` CDN URL for embedding (no SVG fetch) |
| `list_categories` | List all icon categories with counts |

## Runtime approach

Cloudflare deprecated the Durable-Object-backed `McpAgent` class in Agents SDK v0.20.0 (2026-07-27) in favor of a stateless `createMcpHandler(factory)` built on MCP SDK v2 (`@modelcontextprotocol/server`), which ships a `workerd` export condition specifically for the Workers runtime (no `nodejs_compat` flag needed). See:

- https://developers.cloudflare.com/agents/model-context-protocol/guides/migrate-to-mcp-sdk-v2/
- https://developers.cloudflare.com/changelog/post/2026-07-27-agents-sdk-v0.20.0-mcp-sdk-v2/

This server has no per-session state (every request rebuilds the same `McpServer` from the same bundled `icons.json`), so the stateless handler is the right fit -- no Durable Object binding is required.

## Data source

`src/data/icons.json` is copied into this package (`src/icons.json`) at dev/build/deploy time and bundled directly into the Worker, the same tradeoff `packages/mcp` already accepts: offline-capable, refreshed on redeploy, not live-fetched per request. `get_icon` is the only tool that makes an outbound `fetch()` (to `https://thesvg.org/icons/{slug}/{variant}.svg`).

## Apps SDK widget (search_icons only)

`search_icons` returns an embedded HTML resource following OpenAI's Apps SDK widget-resource pattern, verified directly against `openai/openai-apps-sdk-examples` (`pizzaz_server_node/src/server.ts`):

- Resource URI uses the `ui://widget/...` scheme (here: `ui://widget/icon-search-results.html`).
- `mimeType` is `text/html+skybridge`.
- The tool's `_meta` carries `openai/outputTemplate` (pointing at the resource URI), `openai/toolInvocation/invoking`, `openai/toolInvocation/invoked`, and `openai/widgetAccessible`.
- The tool result carries `structuredContent` (query, count, and an `icons` array of `{ slug, name, url }`); the static widget shell reads it client-side via `window.openai.toolOutput` and renders an `<img>` grid pointing at each icon's CDN URL.

The other four tools stay plain text only, per spec.

## Rate limiting

Per-IP sliding window, checked before any tool executes, using [Cloudflare's native Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) rather than an external service like Upstash -- it's a first-party Workers primitive with no extra network hop and no third-party credentials to provision, which is the more idiomatic choice for a Worker that already runs on Cloudflare.

The binding requires a `namespace_id` that's unique per Cloudflare account, which can't be minted without a real account. `wrangler.jsonc` ships the binding **commented out**, and `src/rate-limit.ts` is written to fail open (allow all requests) whenever the binding is absent or its call throws. To enable real limiting:

1. Uncomment the `ratelimits` block in `wrangler.jsonc`.
2. Run `wrangler deploy`; Cloudflare provisions the `namespace_id`.
3. Adjust `simple.limit` / `simple.period` to taste (period must be 10 or 60 seconds).

No authentication is required on the endpoint itself, matching the project's open-data stance.

## Development

```bash
pnpm install         # from the repo root
cd packages/mcp-worker
pnpm dev             # wrangler dev, serves http://localhost:8787
pnpm typecheck
pnpm test
```

`predev` / `prebuild` / `predeploy` scripts copy `../../src/data/icons.json` into `src/icons.json` (gitignored) before each of those commands runs.

## Deployment (manual, by the project owner)

This PR ships code only. Actual deployment requires a real Cloudflare account and cannot be done by an agent:

```bash
cd packages/mcp-worker
pnpm exec wrangler login     # first time only
pnpm run deploy               # wrangler deploy
```

To serve it from a custom subdomain (e.g. `mcp.thesvg.org`):

1. Add a route or custom domain for the Worker in the Cloudflare dashboard (Workers & Pages -> thesvg-mcp -> Settings -> Domains & Routes).
2. Add the DNS record Cloudflare requests (typically a proxied CNAME).

## Configuring as a custom connector

### ChatGPT

1. Settings -> Apps -> Advanced -> enable Developer mode.
2. Settings -> Connectors -> Create.
3. Paste the deployed Worker URL (e.g. `https://mcp.thesvg.org` or the `*.workers.dev` URL), with `/mcp` as the endpoint path if prompted.
4. Auth: none.

**Needs manual verification**: whether ChatGPT's connector setup flow requires an OAuth handshake even for a "none"-auth server. This server does not implement OAuth (matching the "no authentication" requirement), so if ChatGPT's UI insists on an OAuth step for developer-mode connectors, that will need to be resolved by the project owner against a live connector -- it isn't something to guess at in code.

### Claude.ai (web)

1. Settings -> Connectors -> Add custom connector.
2. Paste the deployed Worker URL.
3. Auth type: none.

## Requirements

- Cloudflare account with Workers enabled (to deploy)
- Node.js >= 18 (to build/test locally)
