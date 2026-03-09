<p align="center">
  <a href="https://thesvg.org">
    <img src="https://raw.githubusercontent.com/GLINCKER/thesvg/main/public/logo-github.png" alt="theSVG" width="120" height="120" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/thesvg"><img src="https://img.shields.io/npm/v/thesvg?color=F97316&label=npm" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/thesvg"><img src="https://img.shields.io/npm/dm/thesvg?color=F97316" alt="downloads" /></a>
  <a href="https://github.com/GLINCKER/thesvg/blob/main/LICENSE"><img src="https://img.shields.io/github/license/GLINCKER/thesvg" alt="MIT license" /></a>
  <a href="https://github.com/GLINCKER/thesvg/stargazers"><img src="https://img.shields.io/github/stars/GLINCKER/thesvg?style=social" alt="GitHub stars" /></a>
</p>

<h3 align="center">theSVG</h3>

<p align="center">
  3,847 brand SVG icons for developers and designers.<br/>
  Search, copy, and drop into any project. Free and open source.
</p>

<p align="center">
  <a href="https://thesvg.org"><strong>Browse Icons</strong></a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#cdn">CDN</a> &middot;
  <a href="#api">API</a> &middot;
  <a href="#contributing">Contribute</a>
</p>

<p align="center">
  <a href="https://thesvg.org">
    <img src="https://raw.githubusercontent.com/GLINCKER/thesvg/main/public/og-image.png" alt="theSVG - The Open SVG Brand Library" width="800" />
  </a>
</p>

---

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

Also available as a scoped package:

```bash
npm install @thesvg/icons
```

Tree-shakeable, typed, dual ESM/CJS. Only the icons you import end up in your bundle.

## Features

- **3,847 brand icons** with multi-variant support (color, mono, light, dark, wordmark)
- **Tree-shakeable npm package** - import one icon, ship only that icon
- **TypeScript types** for every icon module
- **Instant search** with fuzzy matching and keyboard shortcut (Cmd+K / Ctrl+K)
- **Filter by category** - AI, Software, Framework, Language, Design, and more
- **One-click copy** as SVG, JSX, Vue, CDN URL, or Data URI
- **Shareable URLs** - every search and icon page has a permanent link
- **Dark mode** default with light theme toggle
- **SEO-optimized** icon pages for every brand
- **Gradient SVG support** - not just flat colors

## CDN

Use any icon directly without installing:

```html
<img src="https://thesvg.org/icons/github/default.svg" width="32" height="32" alt="GitHub" />
```

Or via jsDelivr:

```html
<img src="https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/github/default.svg" width="32" height="32" alt="GitHub" />
```

### URL Pattern

| Source | Pattern |
|--------|---------|
| thesvg.org | `https://thesvg.org/icons/{slug}/{variant}.svg` |
| jsDelivr | `https://cdn.jsdelivr.net/gh/GLINCKER/thesvg@main/public/icons/{slug}/{variant}.svg` |

## Usage

### React

```tsx
import { svg } from "thesvg/github";

export function GitHubLogo() {
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
```

### CDN Component (React)

```tsx
export function BrandIcon({ slug, size = 32 }: { slug: string; size?: number }) {
  return (
    <img
      src={`https://thesvg.org/icons/${slug}/default.svg`}
      width={size}
      height={size}
      alt={slug}
    />
  );
}
```

### Vue

```vue
<template>
  <img :src="`https://thesvg.org/icons/${slug}/default.svg`" :width="size" :alt="slug" />
</template>

<script setup>
defineProps({ slug: String, size: { type: Number, default: 32 } });
</script>
```

## Variants

| Variant | Key | Description |
|---------|-----|-------------|
| Default | `default` | Primary brand color |
| Mono | `mono` | Single-color monochrome |
| Light | `light` | For light backgrounds |
| Dark | `dark` | For dark backgrounds |
| Wordmark | `wordmark` | Text-based logo |

Not all icons have every variant. The `default` variant is always present.

## API

Base URL: `https://thesvg.org`

| Endpoint | Description |
|----------|-------------|
| `GET /api/icons?q=github&category=AI&limit=20` | Search icons |
| `GET /api/icons/{slug}` | Get single icon with metadata |
| `GET /api/categories` | List all categories with counts |
| `GET /icons/{slug}/{variant}.svg` | Raw SVG file |

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`thesvg`](https://www.npmjs.com/package/thesvg) | All icons, one package | Published |
| [`@thesvg/icons`](https://www.npmjs.com/package/@thesvg/icons) | Core icon data | Published |
| [`@thesvg/react`](https://www.npmjs.com/package/@thesvg/react) | 3,847 typed React components | Published |
| [`@thesvg/cli`](https://www.npmjs.com/package/@thesvg/cli) | CLI tool (`npx @thesvg/cli add github`) | Published |
| [`@thesvg/mcp-server`](https://www.npmjs.com/package/@thesvg/mcp-server) | MCP server for Claude/Cursor/Windsurf | Published |

## Contributing

Every brand deserves a place. No gatekeeping.

**Submit an icon:** [thesvg.org/submit](https://thesvg.org/submit) or open a [pull request](https://github.com/GLINCKER/thesvg/pulls).

**Report an issue:** Use our [issue templates](https://github.com/GLINCKER/thesvg/issues/new/choose).

**Development setup:**

```bash
git clone https://github.com/GLINCKER/thesvg.git
cd thesvg
pnpm install
pnpm dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

## Disclaimer

All brand names, logos, and trademarks are the property of their respective owners. theSVG provides these icons for development and design purposes only. Use of brand assets must comply with each brand's usage guidelines.

If you are a brand owner and would like an icon updated or removed, please [open an issue](https://github.com/GLINCKER/thesvg/issues) or email **hello@thesvg.org**.

## License

[MIT](./LICENSE) for the codebase and tooling. Individual brand icons and logos remain the intellectual property of their respective trademark holders.

<p align="center">
  <a href="https://thesvg.org">
    <img src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F5dmyayve2vx8x2clcvt1.png" alt="theSVG - The Open SVG Brand Library" width="800" />
  </a>
</p>

<p align="center">
  <a href="https://thesvg.org">thesvg.org</a>
</p>
