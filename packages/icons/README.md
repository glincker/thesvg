<p align="center">
  <a href="https://thesvg.org">
    <img src="https://raw.githubusercontent.com/GLINCKER/thesvg/main/public/logo.svg" alt="theSVG" width="120" height="120" />
  </a>
</p>

<h3 align="center">@the-svg/icons</h3>

<p align="center">
  3,800+ brand SVG icons for developers. Tree-shakeable, typed, open source.
  <br />
  <a href="https://thesvg.org"><strong>Browse all icons &rarr;</strong></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@the-svg/icons"><img src="https://img.shields.io/npm/v/@the-svg/icons?color=F97316&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@the-svg/icons"><img src="https://img.shields.io/npm/dm/@the-svg/icons?color=F97316" alt="npm downloads" /></a>
  <a href="https://github.com/GLINCKER/thesvg/blob/main/packages/icons/LICENSE"><img src="https://img.shields.io/npm/l/@the-svg/icons?color=F97316" alt="license" /></a>
  <a href="https://github.com/GLINCKER/thesvg"><img src="https://img.shields.io/github/stars/GLINCKER/thesvg?style=social" alt="GitHub stars" /></a>
</p>

---

## Install

```bash
npm install @the-svg/icons
```

Also available as [`thesvg`](https://www.npmjs.com/package/thesvg) for convenience:

```bash
npm install thesvg
```

## Quick Start

```ts
// Import a single icon (tree-shakeable - only this icon ships to your bundle)
import github from "@the-svg/icons/github";

github.svg;        // raw SVG string
github.title;      // "GitHub"
github.hex;        // "181717"
github.categories; // ["DevTool", "VCS"]
github.variants;   // { default: "<svg...>", mono: "<svg...>" }
```

## Usage

### Named exports

```ts
import { svg, title, hex, categories, variants } from "@the-svg/icons/github";
```

### Barrel import

```ts
import { github, vercel, stripe } from "@the-svg/icons";
```

> **Note:** Barrel imports include all icons and skip tree-shaking. Prefer per-icon imports.

### React

```tsx
import { svg } from "@the-svg/icons/github";

export function GitHubLogo() {
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
```

### Variants

Each icon can have multiple variants: `default`, `mono`, `light`, `dark`, `wordmark`, and more.

```ts
import github from "@the-svg/icons/github";

const darkSvg = github.variants["dark"];
const monoSvg = github.variants["mono"];
```

## Icon Shape

Every icon module exports:

```ts
interface IconModule {
  slug: string;                    // "github"
  title: string;                   // "GitHub"
  hex: string;                     // "181717"
  categories: string[];            // ["DevTool", "VCS"]
  aliases: string[];               // ["gh"]
  svg: string;                     // raw SVG (default variant)
  variants: Record<string, string>;// all variant SVGs
  license: string;                 // "MIT"
  url: string;                     // brand URL
}
```

## Tree-Shaking

The package is marked `"sideEffects": false`. Bundlers (webpack, Vite, Rollup, esbuild) will only include icons you import.

```ts
// Your bundle only includes the GitHub icon (~3KB), not all 3,800+
import github from "@the-svg/icons/github";
```

## CDN

Use icons directly without a bundler:

```html
<img src="https://thesvg.org/icons/github/default.svg" alt="GitHub" width="24" />
```

## Packages

| Package | Description |
|---------|-------------|
| [`@the-svg/icons`](https://www.npmjs.com/package/@the-svg/icons) | Core icon data (this package) |
| [`thesvg`](https://www.npmjs.com/package/thesvg) | Convenience wrapper |
| `@the-svg/react` | React components (coming soon) |
| `@the-svg/cli` | CLI tool (coming soon) |

## Contributing

Found a missing icon or incorrect data? [Open an issue](https://github.com/GLINCKER/thesvg/issues) or [submit an icon](https://thesvg.org/submit) on the website.

## License

Icons are distributed under their respective upstream licenses (CC0-1.0, MIT, etc.). See each icon's `license` field.

The package code is [MIT](./LICENSE).

<p align="center">
  <a href="https://thesvg.org">thesvg.org</a>
</p>
