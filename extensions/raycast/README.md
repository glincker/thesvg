# theSVG for Raycast

Search, preview, and copy brand SVG icons, plus a growing set of UI icons, from [thesvg.org](https://thesvg.org) directly in Raycast.

## Commands

### Search Icons

Browse and search brand icons and UI icons in one list. Use the dropdown to show all icons, brand icons only, UI icons only, or a single brand category. Each result carries a Brand or UI tag, and the search bar shows counts read from the loaded indexes.

The UI icon index loads lazily. If it is unavailable, only brand results are shown.

**Actions:**

- **Copy SVG** (`Cmd+C`) - Copy the SVG source code to clipboard
- **Copy Direct URL** (`Cmd+Shift+C`) - Copy the theSVG direct URL
- **Copy jsDelivr URL** (`Cmd+Option+C`) - Copy the jsDelivr CDN URL
- **Open on theSVG** (`Cmd+O`) - Open the icon page in your browser
- **View Details** (`Cmd+D`) - See all variants, SVG source, and metadata
- **Copy as JSX** (`Cmd+Shift+J`) - Copy as a React JSX component
- **Copy as HTML** (`Cmd+Shift+H`) - Copy as an `<img>` tag
- **Copy as Data URI** (`Cmd+Shift+D`) - Copy as inline data URI
- **Copy Hex Color** (`Cmd+Shift+X`) - Copy brand color

**UI icon actions:**

- Copy SVG, JSX, HTML img tag, Data URI, or direct URL. Copied SVG keeps `currentColor` so it stays themeable
- **Choose Look** (`Cmd+L`) - outline (default), glass, duotone, offset, fill, pixel, or depth
- **Open on theSVG** (`Cmd+O`) - Open thesvg.org/ui/&lt;slug&gt;

List previews of UI icons use a fixed readable color.

### Quick Copy

Copy a brand SVG instantly (brand icons only) without opening Raycast's UI. Type the brand name as an argument.

Example: `Copy Brand Icon` > `github` copies the GitHub SVG to your clipboard.

## Preferences

| Setting | Description | Default |
|---------|-------------|---------|
| Default Variant | Which variant to copy (default, mono, light, dark) | Default (Brand Color) |

## Features

- Search brand icons with alias matching, plus a growing set of UI icons in 7 looks
- Filter by 100+ categories (AI, Design, DevTool, Cloud, etc.)
- Preview icon thumbnails in the list
- View all available variants (up to 7 per icon)
- Copy raw SVG source code
- Copy as JSX React component, HTML img tag, or Data URI
- Copy brand hex color
- Copy CDN URLs (thesvg.org + jsDelivr)
- Full detail view with SVG source preview

## Links

- [thesvg.org](https://thesvg.org) - Browse all icons
- [GitHub](https://github.com/glincker/thesvg) - Source code
