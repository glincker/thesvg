<p align="center">
  <a href="https://github.com/glincker/thesvg">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image.png" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image-light.png" />
      <img src="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image-light.png" alt="theSVG - 7,600+ Brand SVG Icons" width="700" />
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@thesvg/astro"><img src="https://img.shields.io/npm/v/@thesvg/astro?color=F97316&label=npm" alt="npm version" /></a>
  <a href="https://www.jsdelivr.com/package/npm/@thesvg/astro"><img src="https://data.jsdelivr.com/v1/package/npm/@thesvg/astro/badge" alt="jsDelivr" /></a>
</p>

# @thesvg/astro

Typed Astro SVG components for all 7,600+ brand icons from [thesvg.org](https://thesvg.org).

- Zero runtime dependencies (Astro is a peer dep)
- Static markup: icons render to plain inline SVG at build time, no client JS
- TypeScript support with full `HTMLAttributes<"svg">` types
- Tree-shakeable ESM - import only what you use
- Individual icon imports for maximum bundle efficiency

## Installation

```bash
npm install @thesvg/astro
# or
pnpm add @thesvg/astro
# or
yarn add @thesvg/astro
```

Astro 3 or later is required as a peer dependency.

## Usage

### Named import from barrel

```astro
---
import { Github, VisualStudioCode, Figma } from "@thesvg/astro";
---

<Github size={24} />
<VisualStudioCode size={24} class="text-blue-500" />
<Figma size={32} aria-label="Figma" role="img" />
```

### Individual icon import (best for build speed)

```astro
---
import Github from "@thesvg/astro/github";
import VisualStudioCode from "@thesvg/astro/visual-studio-code";
---

<Github size={24} />
```

Each icon is a separate module, so importing one never loads the other 7,600.

## Props

| Prop         | Type               | Default | Description                                                   |
| ------------ | ------------------ | ------- | ------------------------------------------------------------- |
| `size`       | `number \| string` | `"1em"` | Sets both width and height                                    |
| `color`      | `string`           | -       | Sets CSS `color`. Single-color icons paint with `currentColor` |
| `class`      | `string`           | -       | CSS class name                                                |
| `aria-label` | `string`           | -       | Accessible label                                              |
| ...          | ...                | -       | Any other SVG attribute is passed through to the `<svg>`      |

`color` only changes icons that are drawn in a single inherited color. Icons
with fixed brand colors keep their colors, and you can still tint single-color
ones with a text color class on a parent.

### Sizing example

```astro
<Github size={24} />
<Github size="2rem" />
<Github class="w-6 h-6" size="100%" />
```

### Accessibility

```astro
<!-- Meaningful icon: label it -->
<Github aria-label="GitHub" role="img" size={24} />

<!-- Decorative icon: hide from screen readers -->
<Github aria-hidden="true" size={24} />
```

## Component names

Slugs are converted to PascalCase component names:

| Slug                 | Component name     |
| -------------------- | ------------------ |
| `github`             | `Github`           |
| `visual-studio-code` | `VisualStudioCode` |
| `figma`              | `Figma`            |
| `01dotai`            | `I01Dotai`         |

Slugs that start with a digit are prefixed with `I` to produce a valid
JavaScript identifier.

## Gradients and ids

Internal SVG ids (gradients, masks, clip paths) are prefixed per icon at build
time, so several icons on one page never overwrite each other's definitions.

## Available icons

Over 7,600 brand icons are available. Browse the full list at
[thesvg.org](https://thesvg.org).

## Community

Questions, icon requests, or ideas? Join the [GLINR Discord](https://discord.gg/Ar5pcaZB99), where theSVG has its own forum.

[![Discord](https://img.shields.io/discord/829168897080557579?style=flat-square&logo=discord&logoColor=white&label=discord&color=5865F2)](https://discord.gg/Ar5pcaZB99)

## License

MIT - see [LICENSE](./LICENSE).

Brand icons and logos are the property of their respective trademark holders. See [thesvg.org](https://thesvg.org) for details.
