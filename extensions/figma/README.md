# theSVG for Figma

Browse and insert 6,000+ brand SVG logos directly into your Figma designs.

## Features

- Search across 6,000+ brand icons
- Filter by category (AI, Analytics, Browser, CMS, etc.)
- One-click insert as editable vector nodes
- Variant picker for icons with light, dark, mono, or color versions (hover an icon, click the number badge in the corner)
- Recent icons row: the last 12 you inserted, kept across sessions
- Keyboard shortcuts: `Enter` inserts the first result, `Cmd/Ctrl+F` focuses search, `Esc` closes the plugin
- Adapts to Figma light and dark themes automatically

## How it works

The plugin pulls the icon catalog and SVG files from the jsDelivr CDN mirror of the [open-source theSVG repo](https://github.com/glincker/thesvg). No traffic touches the thesvg.org website, so the plugin keeps working at full speed even during peak usage of the site. The CDN cache refreshes every few hours, so newly merged icons appear in the plugin within roughly a day of landing on `main`.

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
