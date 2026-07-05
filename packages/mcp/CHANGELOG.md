# @thesvg/mcp-server

## 0.8.0

### Minor Changes

- [#661](https://github.com/glincker/thesvg/pull/661) [`3609a5f`](https://github.com/glincker/thesvg/commit/3609a5f05f2592e0e4e3c15fe1429fa0e2e73de4) Thanks [@thegdsks](https://github.com/thegdsks)! - Onboard Affinity, Outlook Calendar, and Samsung Browser icons; fix Audible source URL

  Adds three community-requested brand icons (Affinity, Outlook Calendar, Samsung Browser)
  with normalized slugs, corrected brand hex values, and valid categories. Also corrects
  the Audible entry URL to the official brand site.

### Patch Changes

- [#664](https://github.com/glincker/thesvg/pull/664) [`9cac540`](https://github.com/glincker/thesvg/commit/9cac5409f60e26dd295001bd6c0f6bc3cd6f7634) Thanks [@thegdsks](https://github.com/thegdsks)! - Correct the Zoho logo to the current official "Logolinism" mark

  The Zoho icon used an outdated single-color mark. Replaced it with the
  current official four-color logo (red, green, blue, yellow): `default`
  and `mono` now carry the interlocking-squares logomark, and new
  `wordmark` / `wordmarkDark` variants provide the full lockup with the
  Zoho wordmark for light and dark backgrounds.

## 0.7.1

### Patch Changes

- docs: fix brand name to theSVG, update icon counts to 6400+, retire VS Code live badge ([#648](https://github.com/glincker/thesvg/issues/648))

## 0.7.0

### Minor Changes

- [#647](https://github.com/glincker/thesvg/pull/647) [`af795b8`](https://github.com/glincker/thesvg/commit/af795b8ef2d5ef2e31d421e84e187ca7dbf94298) Thanks [@thegdsks](https://github.com/thegdsks)! - thesvg v3.1: 6,400+ icons, React package rendering fixes, and GLINR Studios

  New icon milestone: 6,409 brand icons across cloud-native, AI/ML, DevOps, security,
  and productivity tooling. React component rendering fixes for mono variants and
  per-path style fills. GLINR Studios announced as the new home of thesvg.

## 0.6.1

### Patch Changes

- feat: platform expansion — browser stores, open vsx, mcp server ([#566](https://github.com/glincker/thesvg/issues/566))

## 0.6.0

### Minor Changes

- feat: bundle icons.json at build time (no network dependency at startup)
- feat: replace substring search with Fuse.js fuzzy search
- feat: add `list_variants` tool
- feat: fix data types to match actual icons.json schema (variants as object, title field)
- feat: all SVG fetches now use jsDelivr CDN directly
- feat: add smoke test utility (test-smoke.mjs)
- fix: correct icon count to 6,115+

## 0.5.3

### Patch Changes

- ci: path-filter the build, add labeler + dependabot + auto-merge ([#139](https://github.com/glincker/thesvg/issues/139))

## 0.5.2

### Patch Changes

- fix: API docs + CLI registry call, add Selector Logo and myAccessi icons ([#115](https://github.com/glincker/thesvg/issues/115))

## 0.5.1

### Patch Changes

- fix: update org references from GLINCKER to glincker ([#33](https://github.com/glincker/thesvg/issues/33))
