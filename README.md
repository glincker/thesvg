<p align="center">
  <a href="https://thesvg.org">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/glincker/thesvg/main/public/logo-wordmark.svg" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/glincker/thesvg/main/public/logo-wordmark-dark.svg" />
      <img src="https://raw.githubusercontent.com/glincker/thesvg/main/public/logo-wordmark-dark.svg" alt="theSVG" height="48" />
    </picture>
  </a>
</p>

<p align="center">
  <strong>4,000+ brand SVG icons. Search, copy, ship.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/thesvg"><img src="https://img.shields.io/npm/v/thesvg?style=flat-square&color=F97316&label=npm" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/thesvg"><img src="https://img.shields.io/npm/dm/thesvg?style=flat-square&color=F97316&label=downloads" alt="downloads" /></a>
  <a href="https://github.com/glincker/thesvg/stargazers"><img src="https://img.shields.io/github/stars/glincker/thesvg?style=flat-square&label=stars" alt="stars" /></a>
  <a href="https://github.com/glincker/thesvg"><img src="https://img.shields.io/badge/icons-4%2C007-F97316?style=flat-square" alt="4,007 icons" /></a>
  <a href="https://github.com/glincker/thesvg/blob/main/LICENSE"><img src="https://img.shields.io/github/license/glincker/thesvg?style=flat-square" alt="license" /></a>
</p>

<p align="center">
  <a href="https://thesvg.org"><strong>Browse Icons</strong></a> &nbsp;&bull;&nbsp;
  <a href="#install">Install</a> &nbsp;&bull;&nbsp;
  <a href="#cdn">CDN</a> &nbsp;&bull;&nbsp;
  <a href="#api">API</a> &nbsp;&bull;&nbsp;
  <a href="#packages">Packages</a> &nbsp;&bull;&nbsp;
  <a href="https://thesvg.org/compare">Compare</a> &nbsp;&bull;&nbsp;
  <a href="#contributing">Contribute</a>
</p>

<br />

<p align="center">
  <a href="https://thesvg.org">
    <img src="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image.png" alt="theSVG - 4,000+ brand SVG icons" width="720" />
  </a>
</p>

<br />

## Why theSVG?

Most icon libraries focus on UI icons. Brand logos are scattered across press kits, Figma files, and random GitHub repos. **theSVG** is the single source for brand SVGs - searchable, versioned, and available as npm packages, CDN, CLI, API, and MCP server.

- **4,000+ brand icons** across 55+ categories
- **8,400+ SVG variants** - color, mono, light, dark, wordmark
- **Tree-shakeable** - import one icon, ship only that icon
- **TypeScript-first** - fully typed, dual ESM/CJS
- **Framework-agnostic** - React, Vue, Svelte, plain HTML, or CDN
- **AI-ready** - MCP server for Claude, Cursor, and Windsurf

## Install

```bash
npm install thesvg
```

```ts
import github from "thesvg/github";

github.svg;        // raw SVG string
github.title;      // "GitHub"
github.hex;        // "181717"
github.variants;   // { default: "<svg...>", mono: "<svg...>" }
```

Or use the scoped package for tree-shaking:

```bash
npm install @thesvg/icons
```

## Packages

| Package | Description | |
|---------|-------------|---|
| [`thesvg`](https://www.npmjs.com/package/thesvg) | All icons in one package | [![npm](https://img.shields.io/npm/v/thesvg?style=flat-square&color=F97316)](https://www.npmjs.com/package/thesvg) |
| [`@thesvg/icons`](https://www.npmjs.com/package/@thesvg/icons) | Core icon data, tree-shakeable | [![npm](https://img.shields.io/npm/v/@thesvg/icons?style=flat-square&color=F97316)](https://www.npmjs.com/package/@thesvg/icons) |
| [`@thesvg/react`](https://www.npmjs.com/package/@thesvg/react) | Typed React components | [![npm](https://img.shields.io/npm/v/@thesvg/react?style=flat-square&color=F97316)](https://www.npmjs.com/package/@thesvg/react) |
| [`@thesvg/vue`](https://www.npmjs.com/package/@thesvg/vue) | Typed Vue 3 components | [![npm](https://img.shields.io/npm/v/@thesvg/vue?style=flat-square&color=F97316)](https://www.npmjs.com/package/@thesvg/vue) |
| [`@thesvg/svelte`](https://www.npmjs.com/package/@thesvg/svelte) | Typed Svelte components | [![npm](https://img.shields.io/npm/v/@thesvg/svelte?style=flat-square&color=F97316)](https://www.npmjs.com/package/@thesvg/svelte) |
| [`@thesvg/cli`](https://www.npmjs.com/package/@thesvg/cli) | CLI tool (`npx @thesvg/cli add github`) | [![npm](https://img.shields.io/npm/v/@thesvg/cli?style=flat-square&color=F97316)](https://www.npmjs.com/package/@thesvg/cli) |
| [`@thesvg/mcp-server`](https://www.npmjs.com/package/@thesvg/mcp-server) | MCP server for AI assistants | [![npm](https://img.shields.io/npm/v/@thesvg/mcp-server?style=flat-square&color=F97316)](https://www.npmjs.com/package/@thesvg/mcp-server) |

## CDN

Use any icon directly without installing:

```html
<!-- From thesvg.org -->
<img src="https://thesvg.org/icons/github/default.svg" width="32" height="32" alt="GitHub" />

<!-- From jsDelivr -->
<img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/github/default.svg" width="32" height="32" alt="GitHub" />
```

**URL pattern:** `https://thesvg.org/icons/{slug}/{variant}.svg`

## Usage

### React

```tsx
import { Github, Figma } from "@thesvg/react";

export function Logos() {
  return <Github width={24} height={24} className="text-white" />;
}
```

### Vue

```vue
<script setup>
import { Github, Figma } from "@thesvg/vue";
</script>

<template>
  <Github width="24" height="24" />
</template>
```

### Svelte

```svelte
<script>
  import { Github, Figma } from "@thesvg/svelte";
</script>

<Github width="24" height="24" />
```

### CDN

```html
<img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/github/default.svg" width="32" height="32" alt="GitHub" />
```

### CLI

```bash
npx @thesvg/cli add github
npx @thesvg/cli search "ai"
```

## Variants

Icons support up to 7 variants to match any design context:

| Variant | Key | Description |
|---------|-----|-------------|
| Default | `default` | Primary brand color |
| Mono | `mono` | Inherits text color |
| Light | `light` | White, for dark backgrounds |
| Dark | `dark` | Black, for light backgrounds |
| Wordmark | `wordmark` | Full text logo |
| Wordmark Light | `wordmarkLight` | White text logo |
| Wordmark Dark | `wordmarkDark` | Dark text logo |

Not every icon has all variants. `default` is always present.

## API

Base URL: `https://thesvg.org`

| Endpoint | Description |
|----------|-------------|
| `GET /api/icons?q=github&category=AI&limit=20` | Search icons |
| `GET /api/icons/{slug}` | Get single icon with all metadata |
| `GET /api/categories` | List categories with counts |
| `GET /api/registry/{slug}` | shadcn-style registry endpoint |
| `GET /icons/{slug}/{variant}.svg` | Raw SVG file |

```bash
# Example: search for AI icons
curl "https://thesvg.org/api/icons?q=openai&limit=5"
```

## Categories

Icons are organized into 55+ categories:

`AI` `Analytics` `Authentication` `Automotive` `Aviation` `Browser` `Cloud` `CMS` `Community` `Crypto` `Database` `Design` `Devtool` `Education` `Entertainment` `Finance` `Food` `Framework` `Gaming` `Hardware` `Hosting` `IoT` `Language` `Library` `Linux` `Media` `Music` `Payment` `Platform` `Privacy` `Security` `Self-Hosted` `Shopping` `Social` `Software` and more...

## Contributing

Every brand deserves a place. No gatekeeping.

**Submit an icon:** [thesvg.org/submit](https://thesvg.org/submit) or open a [pull request](https://github.com/glincker/thesvg/pulls).

**Development setup:**

```bash
git clone https://github.com/glincker/thesvg.git
cd thesvg
pnpm install
pnpm dev     # http://localhost:3333
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

## Disclaimer

All brand names, logos, and trademarks are the property of their respective owners. theSVG provides these icons for development and design purposes only under nominative fair use. Use of brand assets must comply with each brand's usage guidelines.

If you are a brand owner and would like an icon updated or removed, please [open an issue](https://github.com/glincker/thesvg/issues) or email **support@glincker.com**. See our [Legal Notice](https://thesvg.org/legal), [TRADEMARK.md](./TRADEMARK.md), and [LEGAL.md](./LEGAL.md) for full details.

## License

[MIT](./LICENSE) for the codebase and tooling. Individual brand icons remain the intellectual property of their respective trademark holders.

## Star History

<a href="https://star-history.com/#glincker/thesvg&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=glincker/thesvg&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=glincker/thesvg&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=glincker/thesvg&type=Date" width="600" />
 </picture>
</a>

---

<p align="center">
  <a href="https://thesvg.org">thesvg.org</a> &nbsp;&bull;&nbsp;
  <a href="https://github.com/glincker/thesvg/issues">Issues</a>
</p>
