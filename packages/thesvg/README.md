<p align="center">
  <a href="https://thesvg.org">
    <img src="https://raw.githubusercontent.com/GLINCKER/thesvg/main/public/logo.svg" alt="theSVG" width="120" height="120" />
  </a>
</p>

<h3 align="center">thesvg</h3>

<p align="center">
  3,800+ brand SVG icons for developers. Tree-shakeable, typed, open source.
  <br />
  <a href="https://thesvg.org"><strong>Browse all icons &rarr;</strong></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/thesvg"><img src="https://img.shields.io/npm/v/thesvg?color=F97316&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/thesvg"><img src="https://img.shields.io/npm/dm/thesvg?color=F97316" alt="npm downloads" /></a>
  <a href="https://github.com/GLINCKER/thesvg/blob/main/packages/thesvg/LICENSE"><img src="https://img.shields.io/npm/l/thesvg?color=F97316" alt="license" /></a>
  <a href="https://github.com/GLINCKER/thesvg"><img src="https://img.shields.io/github/stars/GLINCKER/thesvg?style=social" alt="GitHub stars" /></a>
</p>

---

This is the convenience package for [`@the-svg/icons`](https://www.npmjs.com/package/@the-svg/icons). Both packages contain the same 3,800+ icons.

## Install

```bash
npm install thesvg
```

## Quick Start

```ts
import github from "thesvg/github";

github.svg;        // raw SVG string
github.title;      // "GitHub"
github.hex;        // "181717"
github.categories; // ["DevTool", "VCS"]
github.variants;   // { default: "<svg...>", mono: "<svg...>" }
```

## Usage

```ts
// Named exports
import { svg, title, hex } from "thesvg/github";

// Barrel import (includes all icons)
import { github, vercel, stripe } from "thesvg";

// React
import { svg } from "thesvg/github";
const Logo = () => <div dangerouslySetInnerHTML={{ __html: svg }} />;

// Variants
import icon from "thesvg/github";
const dark = icon.variants["dark"];
```

## CDN

```html
<img src="https://thesvg.org/icons/github/default.svg" alt="GitHub" width="24" />
```

## Packages

| Package | Description |
|---------|-------------|
| [`thesvg`](https://www.npmjs.com/package/thesvg) | Convenience wrapper (this package) |
| [`@the-svg/icons`](https://www.npmjs.com/package/@the-svg/icons) | Core icon data |
| `@the-svg/react` | React components (coming soon) |
| `@the-svg/cli` | CLI tool (coming soon) |

## License

MIT. Icons under their respective upstream licenses.

<p align="center">
  <a href="https://thesvg.org">thesvg.org</a>
</p>
