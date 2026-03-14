<p align="center">
  <a href="https://github.com/glincker/thesvg">
    <img src="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image.png" alt="theSVG - 3,847 Brand SVG Icons" width="700" />
  </a>
</p>

# @thesvg/cli

CLI tool to add SVG icons from [thesvg.org](https://thesvg.org) directly into your project - shadcn-style.

## Install

Use without installing (recommended):

```bash
npx @thesvg/cli add github
```

Or install globally:

```bash
npm install -g @thesvg/cli
```

## Commands

### `thesvg add <slug> [slug...]`

Add one or more icons to your project.

```bash
# Add a single icon (SVG by default)
thesvg add github

# Add multiple icons at once
thesvg add github vercel nextjs tailwindcss

# Save as JSX React component (.tsx)
thesvg add github --format jsx

# Save as Vue SFC (.vue)
thesvg add github --format vue

# Custom output directory
thesvg add github --dir ./src/assets/icons

# Specific icon variant
thesvg add github --variant dark

# Combine options
thesvg add github vercel --format jsx --dir ./components/icons
```

**Options:**

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--variant` | `-v` | Icon variant: `default`, `light`, `dark`, `mono`, `wordmark` | `default` |
| `--dir` | `-d` | Output directory | `./public/icons` or `./src/icons` |
| `--format` | `-f` | Output format: `svg`, `jsx`, `vue` | `svg` |

**Output directory detection:**

- If a `public/` directory exists (Next.js, Vite, Astro): saves to `./public/icons/`
- If a `src/` directory exists: saves to `./src/icons/`
- Otherwise: saves to `./icons/`

---

### `thesvg list [options]`

List all available icons from the registry.

```bash
# List icons (default: first 50)
thesvg list

# Filter by category
thesvg list --category AI
thesvg list --category "Version Control"

# Show more results
thesvg list --limit 200
```

**Options:**

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--category` | `-c` | Filter by category name | - |
| `--limit` | `-l` | Max results to display | `50` |

---

### `thesvg search <query>`

Search for icons by name, slug, or keyword.

```bash
# Search by keyword
thesvg search github

# Multi-word search
thesvg search "version control"

# Show more results
thesvg search cloud --limit 30
```

**Options:**

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--limit` | `-l` | Max results to display | `20` |

---

## JSX output

When using `--format jsx`, icons are wrapped in a typed React component:

```tsx
// github.tsx
import type { SVGProps } from "react";

export function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg ...>{/* SVG content */}</svg>
  );
}

export default GithubIcon;
```

## Vue output

When using `--format vue`, icons are wrapped in a Vue template:

```vue
<!-- github.vue -->
<template>
  <svg ...><!-- SVG content --></svg>
</template>
```

## Requirements

- Node.js >= 18 (uses native `fetch`)

## License

MIT
