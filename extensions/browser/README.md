# theSVG browser extension

Search 6,030+ brand SVGs from a popup in Chrome, Firefox, or Edge. Copy raw SVG, the jsDelivr CDN URL, or markdown image syntax.

Manifest V3. No telemetry. Only `cdn.jsdelivr.net` host permission.

## Local development

```bash
cd extensions/browser
pnpm install
pnpm dev            # Chrome (default)
pnpm dev:firefox    # Firefox
```

WXT auto-opens the browser and reloads on save.

## Build packaged ZIPs

```bash
pnpm zip            # Chrome MV3
pnpm zip:firefox    # Firefox MV3
pnpm zip:edge       # Edge MV3
pnpm zip:all        # All three
```

Output lands in `.output/`.

## Load unpacked (for testing without publishing)

- **Chrome / Edge**: open `chrome://extensions`, enable Developer mode, choose Load unpacked, point at `.output/chrome-mv3/` (or `edge-mv3/`).
- **Firefox**: open `about:debugging#/runtime/this-firefox`, choose Load Temporary Add-on, point at `.output/firefox-mv3/manifest.json`.

## Permissions

The extension declares only what it needs to function:

- `storage`: cache the icon registry locally for 24 hours so the popup opens fast
- `clipboardWrite`: copy the SVG, URL, or markdown to the user's clipboard
- `host_permissions`: `https://cdn.jsdelivr.net/*` only

No analytics. No tracking. No external API calls beyond the public jsDelivr CDN.

## Publishing (maintainer task, follow-up PR)

- **Chrome Web Store**: `https://chrome.google.com/webstore/devconsole` (one-time $5 fee, ~1 to 2 day review)
- **Firefox AMO**: `https://addons.mozilla.org/developers/` (free, source review can take 3 to 7 days)
- **Edge Add-ons**: `https://partner.microsoft.com/dashboard/microsoftedge/` (free, ~1 to 2 days)

Safari is intentionally out of scope for v1 (requires a Mac app wrapper and an Apple Developer account).

## Roadmap

- v1.1: context menu integration on right-click, image search via alt text
- v1.2: keyboard shortcuts for quick-copy of the last used icon
- v1.3: variant carousel inline (color, mono, dark, light, wordmark)
