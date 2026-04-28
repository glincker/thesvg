# theSVG for Figma

Browse and insert 4,000+ brand SVG logos directly into your Figma designs.

## Features

- Search across 4,000+ brand icons
- Filter by category (AI, Analytics, Browser, CMS, etc.)
- One-click insert into your canvas
- Icons are inserted as editable vector nodes
- Supports Figma light and dark themes

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Figma Desktop](https://www.figma.com/downloads/) app

### Setup

```bash
npm install
npm run build
```

### Load in Figma

1. Open Figma Desktop
2. Go to **Plugins > Development > Import plugin from manifest...**
3. Select the `manifest.json` file from this directory

### Watch mode

```bash
npm run dev
```

This rebuilds on file changes. Reload the plugin in Figma to see updates.

## How it works

The plugin fetches the static manifest at [/api/registry.json](https://thesvg.org/api/registry.json) and pulls SVGs directly from `/icons/{slug}/default.svg`. Icons are inserted as native Figma vector nodes using `figma.createNodeFromSvg()`.

## Publishing

1. Get a plugin ID from Figma (Plugins > Manage plugins > Create new plugin)
2. Add the ID to `manifest.json`
3. Build: `npm run build`
4. Publish via Figma Desktop (Plugins > Manage plugins > Publish)

### Required assets

| Asset | Size |
|-------|------|
| Plugin icon | 128 x 128 px |
| Cover image | 1920 x 1080 px |
