<p align="center">
  <a href="https://github.com/glincker/thesvg">
    <img src="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image.png" alt="thesvg - 6,030+ brand SVG icons" width="700" />
  </a>
</p>

# @thesvg/mcp-server

MCP (Model Context Protocol) server for [thesvg.org](https://thesvg.org). Gives AI agents in Claude Desktop, Cursor, Claude Code, and any MCP-aware client direct access to 6,115+ brand SVG icons -- no API key required.

## What it does

The server exposes five tools that AI agents can call:

| Tool | Description |
|------|-------------|
| `search_icons` | Fuzzy search icons by brand name or slug |
| `get_icon` | Fetch raw SVG markup + metadata for a specific icon |
| `list_variants` | List available variants for a specific icon |
| `get_icon_url` | Get a jsDelivr CDN URL for embedding (no SVG fetch) |
| `list_categories` | List all icon categories with counts |

## Data source

Icons are bundled at build time from the thesvg.org open registry (6,115+ entries). SVG content is fetched on demand from the jsDelivr CDN at `https://cdn.jsdelivr.net/gh/glincker/thesvg@v0.6.0/public/icons/{slug}/{variant}.svg`.

**Tradeoff**: bundling the registry (~2.8 MB) means the server starts instantly with no network dependency and works offline for search/URL queries. Only `get_icon` requires a network request (to fetch the SVG from jsDelivr). To refresh to a newer registry, rebuild the package.

## Installation

No install needed with npx:

```json
{
  "mcpServers": {
    "thesvg": {
      "command": "npx",
      "args": ["-y", "@thesvg/mcp-server"]
    }
  }
}
```

Or install globally:

```bash
npm install -g @thesvg/mcp-server
```

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "thesvg": {
      "command": "npx",
      "args": ["-y", "@thesvg/mcp-server"]
    }
  }
}
```

If you installed globally:

```json
{
  "mcpServers": {
    "thesvg": {
      "command": "thesvg-mcp"
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project, or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "thesvg": {
      "command": "npx",
      "args": ["-y", "@thesvg/mcp-server"]
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add thesvg -- npx -y @thesvg/mcp-server
```

Or add to `.claude/settings.json` in your project:

```json
{
  "mcpServers": {
    "thesvg": {
      "command": "npx",
      "args": ["-y", "@thesvg/mcp-server"]
    }
  }
}
```

## Tools

### `search_icons`

Fuzzy search for brand icons by name or slug.

**Input**:
```json
{
  "query": "github",
  "limit": 10
}
```

**Output** (example):
```text
Found 5 icons for "github":
- GitHub (slug: `github`) | variants: default, mono | categories: Software, Development
- GitHub Actions (slug: `github-actions`) | variants: default, mono | categories: DevOps
...
```

---

### `get_icon`

Fetch the raw SVG markup for a specific icon variant.

**Input**:
```json
{
  "slug": "stripe",
  "variant": "default"
}
```

**Output** (example):
```text
# Stripe

**Slug**: `stripe`
**Variant**: default
**CDN URL**: https://cdn.jsdelivr.net/gh/glincker/thesvg@v0.6.0/public/icons/stripe/default.svg
**Available variants**: default, mono, dark

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>
```

---

### `list_variants`

List available variants for a specific icon.

**Input**:
```json
{ "slug": "openai" }
```

**Output** (example):
```text
openai has 6 variants:
- `default` -- https://cdn.jsdelivr.net/gh/glincker/thesvg@v0.6.0/public/icons/openai/default.svg
- `light` -- https://...
- `dark` -- https://...
- `wordmark` -- https://...
- `wordmarkLight` -- https://...
- `wordmarkDark` -- https://...
```

---

### `get_icon_url`

Get a CDN URL for embedding an icon in HTML or Markdown (no SVG fetch).

**Input**:
```json
{
  "slug": "openai",
  "variant": "default"
}
```

**Output** (example):
```text
CDN URL for `openai` (variant: default):

https://cdn.jsdelivr.net/gh/glincker/thesvg@v0.6.0/public/icons/openai/default.svg

Example usage:
<img src="..." alt="OpenAI" width="32" height="32" />

![OpenAI](...)
```

---

### `list_categories`

Discover all icon categories with counts.

**Input**: `{}` (no parameters)

**Output** (example):
```text
128 categories across 6115 icons:

- Software - 4,200 icons
- Platform - 2,100 icons
- AI - 310 icons
...
```

## Development

```bash
# Install dependencies
npm install

# Build (copies icons.json, compiles TypeScript)
npm run build

# Run locally
node dist/index.js

# Quick smoke test
node test-smoke.mjs
```

## Requirements

- Node.js >= 18
- Internet access only for `get_icon` (fetches SVGs from jsDelivr CDN)
