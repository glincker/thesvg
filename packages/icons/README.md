<p align="center">
  <a href="https://github.com/glincker/thesvg">
    <img src="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image.png" alt="theSVG - 3,847 Brand SVG Icons" width="700" />
  </a>
</p>

<h3 align="center">@thesvg/icons</h3>

<p align="center">
  3,800+ brand SVG icons for developers. Tree-shakeable, typed, open source.
  <br />
  <a href="https://thesvg.org"><strong>Browse all icons &rarr;</strong></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@thesvg/icons"><img src="https://img.shields.io/npm/v/@thesvg/icons?color=F97316&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@thesvg/icons"><img src="https://img.shields.io/npm/dm/@thesvg/icons?color=F97316" alt="npm downloads" /></a>
  <a href="https://github.com/glincker/thesvg/blob/main/packages/icons/LICENSE"><img src="https://img.shields.io/npm/l/@thesvg/icons?color=F97316" alt="license" /></a>
  <a href="https://github.com/glincker/thesvg"><img src="https://img.shields.io/github/stars/glincker/thesvg?style=social" alt="GitHub stars" /></a>
</p>

---

## Install

```bash
npm install @thesvg/icons
```

Also available as [`thesvg`](https://www.npmjs.com/package/thesvg) for convenience:

```bash
npm install thesvg
```

## Quick Start

```ts
// Import a single icon (tree-shakeable - only this icon ships to your bundle)
import github from "@thesvg/icons/github";

github.svg;        // raw SVG string
github.title;      // "GitHub"
github.hex;        // "181717"
github.categories; // ["DevTool", "VCS"]
github.variants;   // { default: "<svg...>", mono: "<svg...>" }
```

## Usage

### Named exports

```ts
import { svg, title, hex, categories, variants } from "@thesvg/icons/github";
```

### Barrel import

```ts
import { github, vercel, stripe } from "@thesvg/icons";
```

> **Note:** Barrel imports include all icons and skip tree-shaking. Prefer per-icon imports.

### React

```tsx
import { svg } from "@thesvg/icons/github";

export function GitHubLogo() {
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
```

### Variants

Each icon can have multiple variants: `default`, `mono`, `light`, `dark`, `wordmark`, and more.

```ts
import github from "@thesvg/icons/github";

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
import github from "@thesvg/icons/github";
```

## CDN

Use icons directly without a bundler:

```html
<img src="https://thesvg.org/icons/github/default.svg" alt="GitHub" width="24" />
```

## Packages

| Package | Description |
|---------|-------------|
| [`@thesvg/icons`](https://www.npmjs.com/package/@thesvg/icons) | Core icon data (this package) |
| [`thesvg`](https://www.npmjs.com/package/thesvg) | Convenience wrapper |
| [`@thesvg/react`](https://www.npmjs.com/package/@thesvg/react) | Typed React components |
| [`@thesvg/cli`](https://www.npmjs.com/package/@thesvg/cli) | CLI tool |

## Contributing

Found a missing icon or incorrect data? [Open an issue](https://github.com/glincker/thesvg/issues) or [submit an icon](https://thesvg.org/submit) on the website.

## License

Icons are distributed under their respective upstream licenses (CC0-1.0, MIT, etc.). See each icon's `license` field.

The package code is [MIT](./LICENSE).

<p align="center">
  <a href="https://thesvg.org">thesvg.org</a>
</p>
