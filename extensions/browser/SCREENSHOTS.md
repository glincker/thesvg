# Screenshot Requirements - thesvg Browser Extension

## Per-Store Requirements

### Chrome Web Store

| Requirement | Detail |
|---|---|
| Dimensions | 1280x800 px OR 640x400 px |
| Format | PNG or JPEG |
| Minimum count | 1 |
| Maximum count | 5 |
| Notes | Shown in the Chrome Web Store listing. Use 1280x800 for sharpest display. No rounded corners needed -- Chrome applies them automatically. |

### Firefox Add-ons (AMO)

| Requirement | Detail |
|---|---|
| Dimensions | Max 2400x1800 px (no minimum enforced) |
| Recommended | 1280x800 px to match Chrome assets |
| Format | PNG or JPEG |
| Minimum count | 0 (optional but strongly recommended) |
| Maximum count | 10 |
| Notes | Firefox shows screenshots in a carousel. Use the same 1280x800 assets as Chrome -- they are accepted without modification. |

### Microsoft Edge Add-ons

| Requirement | Detail |
|---|---|
| Dimensions | 1366x768 px OR 640x480 px |
| Format | PNG or JPEG |
| Minimum count | 1 |
| Maximum count | 10 |
| Notes | Edge reviewer guidelines recommend showing the extension in action within a browser window. A 1366x768 browser screenshot with the popup open works well. |

---

## Recommended Shots to Capture (4 total -- covers all stores)

### Shot 1: Popup open, search in progress
**Filename:** `screenshot-01-search.png`
**Dimensions:** 1280x800
**Capture:** Open Chrome with a relevant page in the background (e.g., GitHub). Open the thesvg popup. Type a brand name (e.g., "github") to show the search results list with 3-5 results visible. Show the search input focused with the query visible.
**Purpose:** Demonstrates core search functionality immediately.

### Shot 2: Icon detail / variant picker
**Filename:** `screenshot-02-variants.png`
**Dimensions:** 1280x800
**Capture:** Click on an icon that has multiple variants (e.g., a brand with color, mono, and dark variants). Show the variant selector with the icon preview and the three copy buttons (SVG, CDN, Markdown) visible.
**Purpose:** Shows depth of features (variant support, copy actions).

### Shot 3: Copy action confirmation
**Filename:** `screenshot-03-copy.png`
**Dimensions:** 1280x800
**Capture:** Click the "Copy SVG" button and capture the success toast/confirmation state. This shows the copy action worked and gives confidence to reviewers that the copy feature is functional.
**Purpose:** Demonstrates the key copy workflow.

### Shot 4: Empty state / browse view
**Filename:** `screenshot-04-browse.png`
**Dimensions:** 1280x800
**Capture:** Open the popup with no search query typed. Show the default browse/recent view or the full icon grid scrolled to show multiple brands.
**Purpose:** Establishes scope (6,030+ icons visible as a grid) and initial UX.

---

## How to Capture (macOS)

1. Open Chrome with a neutral, professional background page (e.g., the thesvg.org homepage).
2. Open DevTools and set the viewport to 1280x800.
3. Click the thesvg toolbar icon to open the popup.
4. Use macOS screenshot (`Cmd+Shift+4`, then select the browser window area) or use a screen recording tool that exports at 2x for retina -- then resize to exactly 1280x800.
5. Export as PNG (lossless).

**Tip:** Use a dark browser theme for screenshots -- the extension's dark mode looks sharper and more distinctive in store listings.

---

## Promotional Images (Optional but Recommended)

Chrome Web Store also accepts a "marquee promotional tile" (1400x560 px) for featuring. This is optional but improves discoverability if the extension gets featured.

**Suggested composition:** thesvg logo mark on left, 3-4 brand icon examples arranged on right, tagline "The Open SVG Brand Library" in body text, no em dashes.
