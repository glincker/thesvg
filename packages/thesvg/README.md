<p align="center">
  <a href="https://github.com/glincker/thesvg">
    <img src="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image.png" alt="theSVG - 5,880+ brand SVG icons" width="700" />
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
  <a href="https://github.com/glincker/thesvg/blob/main/packages/thesvg/LICENSE"><img src="https://img.shields.io/npm/l/thesvg?color=F97316" alt="license" /></a>
  <a href="https://github.com/glincker/thesvg"><img src="https://img.shields.io/github/stars/glincker/thesvg?style=social" alt="GitHub stars" /></a>
</p>

---

This is the convenience package for [`@thesvg/icons`](https://www.npmjs.com/package/@thesvg/icons). Both packages contain the same 3,800+ icons.

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
| [`@thesvg/icons`](https://www.npmjs.com/package/@thesvg/icons) | Core icon data |
| [`@thesvg/react`](https://www.npmjs.com/package/@thesvg/react) | Typed React components |
| [`@thesvg/cli`](https://www.npmjs.com/package/@thesvg/cli) | CLI tool |

## License

MIT. Icons under their respective upstream licenses.

<p align="center">
  <a href="https://thesvg.org">thesvg.org</a>
</p>
