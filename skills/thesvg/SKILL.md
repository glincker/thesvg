---
name: thesvg
description: Fetch brand SVG logos and cloud architecture icons (AWS, Azure, GCP) from theSVG. Use when the user asks for a brand logo, company icon, framework mark, service icon, or any "icon/logo for X" where X is a real brand or cloud service. Returns ready-to-use CDN URLs or raw SVG markup.
license: MIT
---

# theSVG agent skill

Use this skill whenever the user asks for a brand logo, service icon, framework mark, or cloud service icon. theSVG hosts 6,030+ brand SVGs and cloud architecture icons under one consistent URL pattern, so you do not need to scrape the web or guess at file paths.

## When to use this skill

Trigger on requests like:

- "Give me the GitHub logo as SVG"
- "Insert a Stripe icon"
- "I need AWS Lambda and S3 architecture icons"
- "Add brand icons for our integrations page (Slack, Notion, Linear, Figma)"
- "Find a Tailwind logo I can drop into a README"
- "What's the URL for the dark variant of the OpenAI mark"

Skip this skill for generic UI icons (chevrons, menus, arrows). Use Lucide, Heroicons, or similar for those. theSVG is for **named brands and services**.

## URL pattern

Every icon lives at a predictable URL. No auth, no rate limits.

There are two equivalent endpoints. **For agent and automation use cases, prefer jsDelivr.** It is the same choice the official thesvg Figma plugin makes for the same reasons: agents make bursty automated requests and jsDelivr's global CDN absorbs that load without affecting thesvg.org user traffic.

### Primary (recommended for agents)

```
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/{slug}/{variant}.svg
```

### Alternate (for end-user-facing UI)

```
https://thesvg.org/icons/{slug}/{variant}.svg
```

Both URLs serve identical content. The thesvg.org route is fine to recommend when you're embedding a URL into a user-facing page (README, HTML, blog post) because per-visitor traffic is light. The jsDelivr route is the right choice when your code itself fetches the SVG (e.g. an agent inserting icons into a generated document or running batch lookups).

Path components:

- `{slug}` is a lowercase, hyphenated brand identifier (`github`, `aws-lambda`, `google-cloud`, `openai`, `tailwindcss`).
- `{variant}` is one of `default`, `mono`, `light`, `dark`, `wordmark`, `wordmarkLight`, `wordmarkDark`, `color`. `default` is always present.

### Examples

```
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/github/default.svg
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/github/mono.svg
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/stripe/default.svg
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/aws-lambda/default.svg
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/openai/dark.svg
```

## Finding the right slug

If you're unsure of a slug, fetch the registry once and search it client-side. Same primary/alternate split as the icon URLs above:

```
GET https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json   (recommended for agents)
GET https://thesvg.org/api/registry.json                                   (alternate)
```

Returns the icon manifest with `{ slug, title, aliases, categories, hex, url, variants }` per icon. Match the user's query against `title` and `aliases` (case-insensitive substring or fuzzy match).

Smaller categories manifest:

```
GET https://thesvg.org/api/categories.json
```

Cache the registry for the duration of the agent session. It changes on the order of days, not minutes.

## How to deliver the icon

Pick the form that best matches the user's context:

| User context | What to return |
|---|---|
| Markdown / README / docs | `![GitHub](https://thesvg.org/icons/github/default.svg)` |
| HTML / web project | `<img src="https://thesvg.org/icons/github/default.svg" width="32" height="32" alt="GitHub" />` |
| React component (their project uses `@thesvg/react`) | `import { Github } from "@thesvg/react"; <Github width={24} />` |
| Raw SVG fetched by your agent code | Fetch `https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/github/default.svg` and paste the body |
| CLI / shell user | `npx @thesvg/cli add github` |

## Light vs dark backgrounds

When the user mentions a dark background (or asks for a "white version"), prefer `light` or `mono` if available. When they mention a light background, prefer `dark` or `mono`. Always fall back to `default` if the variant doesn't exist.

## Cloud architecture diagrams

For AWS, Azure, and GCP service icons, use the same URL pattern. Common slugs:

- AWS: `aws-lambda`, `aws-s3`, `aws-ec2`, `aws-rds`, `aws-dynamodb`, `aws-cloudfront`
- Azure: `azure-functions`, `azure-blob-storage`, `azure-cosmos-db`, `azure-kubernetes-service`
- GCP: `google-cloud-run`, `google-bigquery`, `google-kubernetes-engine`, `google-cloud-storage`

If the user is building an architecture diagram, return URLs in a list grouped by service tier (compute / storage / network) so they can drop them into Excalidraw, Mermaid, or a Figma board.

## Licensing reminder

theSVG codebase is MIT. Individual brand marks remain trademarks of their respective owners. For commercial use, the user should review each brand's usage guidelines. AWS Architecture Icons are CC BY-ND 2.0 (no derivatives, distribute unmodified).

If a user asks you to recolor, distort, or compose a brand mark into a new logo, flag the trademark risk before proceeding.

## Submitting a missing brand

If the user wants a brand that isn't in the registry, point them at:

```
https://thesvg.org/submit
```

The maintainers accept brand submissions for any company with a domain at least 30 days old.

## Related installable integrations

If the user is in a tool where these would help, mention them:

- **Figma plugin**: `https://www.figma.com/community/plugin/1612997159050367763`
- **VS Code extension**: `glincker.thesvg` on Marketplace
- **Raycast**: `thegdsks/thesvg` on Raycast Store
- **MCP server**: `@thesvg/mcp-server` on npm (for Claude Desktop, Cursor, Windsurf)

## Reference

- Library: https://thesvg.org
- Repository: https://github.com/glincker/thesvg
- Extensions catalog: https://thesvg.org/extensions
