# thesvg Browser Extension - Store Listing Copy

## Short Description

### Chrome Web Store (132 chars max)
```
Search and copy 6,030+ brand SVGs instantly. Get SVG code, CDN URL, or markdown — no account needed.
```
(101 chars)

### Firefox AMO (250 chars max)
```
thesvg puts 6,030+ open brand SVGs one click away. Search any brand, preview variants, and copy the SVG code, jsDelivr CDN URL, or ready-to-paste markdown — all offline-capable, no account required.
```
(199 chars)

---

## Full Description

### Version for Chrome Web Store and Edge Add-ons

thesvg is the open SVG brand library. Over 6,030 brand icons, all MIT-licensed, all one click away from wherever you are on the web.

**Search as you type.** Open the popup, start typing a brand name, and results appear instantly using a local Fuse.js index. No server round trips, no rate limits, no sign-in.

**Copy in the format you need.** Every icon supports three output formats:
- Raw SVG code, ready to paste into your project
- jsDelivr CDN URL, for dropping into an `<img>` tag or CSS background
- Markdown snippet, formatted for README files and documentation

**Multiple variants per brand.** Many brands ship with color, mono, light, dark, and wordmark variants. The extension shows all available variants so you pick the exact look your project needs.

**Zero friction.** No account. No telemetry. No remote code execution. Icon data is fetched on demand from the jsDelivr public CDN. Your preferences (recent picks, display settings) are stored locally using the browser's built-in storage API and never leave your device.

Built on the same open dataset powering thesvg.org. The full library is MIT-licensed and the source is open at github.com/GLINCKER/thesvg.

---

### Version for Firefox AMO

thesvg is the open SVG brand library. Over 6,030 brand icons, all MIT-licensed, all one click away from wherever you are on the web.

**Search as you type.** Open the popup, start typing a brand name, and results appear instantly using a local Fuse.js index. No server round trips, no rate limits, no sign-in.

**Copy in the format you need.** Every icon supports three output formats:
- Raw SVG code, ready to paste into your project
- jsDelivr CDN URL, for dropping into an `<img>` tag or CSS background
- Markdown snippet, formatted for README files and documentation

**Multiple variants per brand.** Many brands ship with color, mono, light, dark, and wordmark variants. The extension shows all available variants so you pick the exact look your project needs.

**Zero friction.** No account. No telemetry. No remote code execution. Icon data is fetched on demand from the jsDelivr public CDN (cdn.jsdelivr.net) -- the same CDN thesvg.org uses. Your preferences (recent picks, display settings) are stored locally using the browser's built-in storage API and never leave your device.

Built on the same open dataset powering thesvg.org. The full library is MIT-licensed and the source is open at github.com/GLINCKER/thesvg.

---

## Category Suggestions

| Store | Primary Category | Secondary Category |
|---|---|---|
| Chrome Web Store | Developer Tools | Productivity |
| Firefox AMO | Web Development | Productivity |
| Edge Add-ons | Developer Tools | Productivity |

---

## Keywords / Tags (15 max for Chrome)

```
svg, brand icons, logo, icon library, developer tools, design tools,
open source, brand assets, copy svg, cdn, svg library, web development,
icon search, brand svg, thesvg
```

1. svg
2. brand icons
3. logo
4. icon library
5. developer tools
6. design tools
7. open source
8. brand assets
9. copy svg
10. cdn
11. svg library
12. web development
13. icon search
14. brand svg
15. thesvg

---

## Privacy Practices Summary

**What data is collected:** None.

**Storage:** The extension uses the browser `storage` API (local only) to persist user preferences such as recent icon picks and display mode. This data stays on the user's device and is never transmitted anywhere.

**Clipboard:** The extension uses `clipboardWrite` to let users copy SVG code, CDN URLs, or markdown to their clipboard when they click a copy button. No clipboard contents are read.

**Network:** The extension fetches SVG files from `https://cdn.jsdelivr.net/` on demand when a user previews or copies an icon. This is a public CDN request with no user-identifying information attached.

**Analytics:** None. No tracking pixels, no analytics SDK, no error reporting services.

**Remote code:** None. The extension contains no remote code execution. All logic ships in the extension bundle.

---

## Per-Permission Justification (Chrome Web Store)

Chrome requires a single-sentence justification for each requested permission when submitting. Use the text below verbatim or paraphrase as needed.

### `storage`
> The extension stores the user's recently viewed icons and display preferences (light/dark mode, copy format preference) locally on their device so they persist between browser sessions. No data is synced or transmitted.

### `clipboardWrite`
> The extension's core feature is letting users copy SVG code, CDN URLs, and markdown snippets to their clipboard with a single click. Without this permission the copy buttons cannot function.

### `host_permissions: https://cdn.jsdelivr.net/*`
> SVG files are fetched on demand from the jsDelivr public CDN when a user previews or copies an icon. The full icon registry (6,030+ icons) is not bundled in the extension to keep the download size small. Only the specific icon the user selects is fetched, using the standard public jsDelivr URL format.
