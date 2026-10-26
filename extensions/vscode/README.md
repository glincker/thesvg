# theSVG for VS Code

Search and copy brand icons directly from VS Code, plus a growing set of UI icons. Brand logos, AWS, Azure, GCP, and Kubernetes architecture icons, and UI icons in seven looks.

## Features

- **Search** brand icons from the command palette
- **UI icons** as a second kind: use the button in the picker title bar to switch between Brand and UI icons. Search by title, slug, tag or category, then pick a look (outline, glass, duotone, offset, fill, pixel, depth). Copies keep `currentColor` so icons follow your theme. If the UI index cannot be loaded, the picker stays on brand icons
- **Copy SVG** to clipboard with one keystroke
- **Copy as JSX** for React projects
- **Copy CDN link** (jsDelivr) for HTML/CSS
- **Insert at cursor** directly into your code
- **Multiple variants** per icon (color, mono, dark, light, wordmark)
- **Offline-first** - icon index cached after first load

## Usage

1. Open the command palette: `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Run `theSVG: Search Icons`
3. Type an icon name (e.g. "lambda", "stripe", "compute") and pick one
4. Choose an action (copy SVG, copy JSX, copy CDN, insert, etc.)

> No default shortcut is bound so nothing gets shadowed. Bind any command to a key you like via `Preferences: Open Keyboard Shortcuts` and search for `thesvg`.

## Commands

| Command | Description |
|---------|-------------|
| `theSVG: Search Icons` | Open icon search |
| `theSVG: Copy SVG` | Search and copy SVG |
| `theSVG: Copy as JSX` | Search and copy JSX component |
| `theSVG: Copy CDN Link` | Search and copy jsDelivr URL |
| `theSVG: Insert SVG at Cursor` | Search and insert into editor |

## Collections

UI icons load on demand, so their count is shown in the picker once loaded.

| Collection | Icons |
|-----------|-------|
| Brand Icons | 4,800+ |
| AWS Architecture | 739 |
| Azure Services | 626 |
| Google Cloud | 214 |
| Kubernetes | 38 |

## Links

- Browse icons: [thesvg.org](https://thesvg.org)
- Source: [github.com/glincker/thesvg](https://github.com/glincker/thesvg)
- npm: [npmjs.com/package/thesvg](https://www.npmjs.com/package/thesvg)

## License

MIT
