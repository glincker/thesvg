# theSVG for Figma store listing copy

Copy-paste source for the Figma Community plugin page.
Keep this file in sync when the catalog grows or features change.

---

## Description

```
Browse and insert 6,000+ brand SVG logos directly into your Figma designs.
One click and the mark drops in as an editable vector node.

What's in the catalog:
- 6,000+ brand icons across finance, gaming, entertainment, dev tools,
  consumer goods, telecom, auto, pharma, and more
- Multiple variants per brand where available: color, monochrome, light,
  dark, wordmark
- Filter by 50+ categories
- Real-time search across brand names and aliases

Workflow:
- Insert any icon with one click
- Variant picker for brands with multiple versions (hover, click the badge)
- Recents row remembers the last 12 icons you inserted across sessions
- Keyboard shortcuts: Enter inserts the first result, Cmd+F focuses
  search, Esc closes
- Adapts to Figma's light and dark themes automatically

Backed by the open-source theSVG library. Catalog and icon files come
from the jsDelivr CDN, so the plugin keeps working at full speed even
during peak usage of thesvg.org.

Open source: https://github.com/GLINCKER/thesvg
Website: https://thesvg.org
```

---

## Tagline (one-liner)

```
Search, preview, and insert from 6,000+ brand SVG logos.
```

---

## What's new in this version (for the reviewer)

```
v1.2.0

- Fixed the API host redirect that caused all network requests to fail
  in the previous submission (root cause of the prior rejection).
- Added a Recents row: last 12 inserted icons, persisted via
  figma.clientStorage so they survive plugin closes and Figma restarts.
- Added a variant picker for icons with multiple variants (color, mono,
  dark, light, wordmark). Hover an icon, click the badge in the corner,
  pick from a thumbnail menu.
- Keyboard shortcuts: Enter inserts the first search result, Cmd/Ctrl+F
  focuses the search input, Esc closes the variant menu and then the
  plugin.
- Moved all network traffic to the jsDelivr CDN mirror of the
  open-source repo. Single domain in allowedDomains now
  (cdn.jsdelivr.net). No traffic touches thesvg.org from the plugin.
- Insert retries once on transient network failure before showing an
  error.
- Better initial loading state ("Loading catalog..." instead of a
  frozen "Loading...").
```

---

## Categories (Figma dropdown)

Pick: **Design tools** · **Brand assets** (or whatever closest match Figma offers)

---

## Tags

```
brands, logos, svg, icons, brand-assets, design-system, open-source, free
```

---

## Publish flow

1. Open Figma Desktop, open any file
2. Plugins → Manage plugins → Development tab → theSVG → Publish update
3. On the Edit plugin screen, paste the **Description** block above
4. In the **What's new in this version** field, paste the v1.2.0 block above
5. Bump version to **1.2.0** if Figma asks
6. Click Publish. Goes back into the review queue (typically 1-3 business days)

## Don't unpublish

Unpublishing wipes installs and reviews. "Publish update" keeps everything and just resubmits the new build for review.
