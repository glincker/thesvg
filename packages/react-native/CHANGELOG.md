# @thesvg/react-native

## 4.0.2

### Patch Changes

- [#1451](https://github.com/glincker/thesvg/pull/1451) [`93ed710`](https://github.com/glincker/thesvg/commit/93ed7104ac60db1e6dc1e7537bb8c7ca343603db) Thanks [@gyamfidennist](https://github.com/gyamfidennist)! - Build and validate the React Native package before publishing so npm releases include the compiled icons and type declarations.

## 4.0.0

### Major Changes

- [#1408](https://github.com/glincker/thesvg/pull/1408) [`e6a825f`](https://github.com/glincker/thesvg/commit/e6a825f21b0de10f2a4df4dbcee0ba30a086bfa3) Thanks [@thegdsks](https://github.com/thegdsks)! - theSVG 4.0: UI icons are here. The major version marks the release that adds a second section of 129 UI icons (outline, glass, duotone, offset, fill, pixel and depth), published as the new `@thesvg/ui`, `@thesvg/ui-react`, `@thesvg/ui-vue`, `@thesvg/ui-svelte` and `@thesvg/ui-react-native` packages. There are no API changes in this package: existing brand imports, names and files are unchanged.

## 3.4.0

### Minor Changes

- [#1326](https://github.com/glincker/thesvg/pull/1326) [`cd0d0eb`](https://github.com/glincker/thesvg/commit/cd0d0ebab86b0e5bb53e8ee945a8b9cec4b5667b) Thanks [@thegdsks](https://github.com/thegdsks)! - Brand families and 150+ new icons. theSVG now groups products by owner (Amazon, Google, Microsoft, Apple, Meta, Adobe and more) with a page per family, and the packages gain a large batch of self-hosted apps, cloud native projects and integration brands, refreshed marks, and corrected default colours for icons that were white-only.

## 3.3.12

### Patch Changes

- [#1210](https://github.com/glincker/thesvg/pull/1210) [`c17e015`](https://github.com/glincker/thesvg/commit/c17e0159617637ff6b843fbac238d5cf5b796a9d) Thanks [@OmShiv](https://github.com/OmShiv)! - Add the missing viewBox to 229 icon SVGs
  
  The React, React Native, Vue and Svelte components fall back to viewBox "0 0 24 24"
  when an SVG has none, so 15 logos drawn on larger canvases (Amazon,
  Amazon Music, BBC, Best Buy, Citibank, Disney and others) rendered
  cropped or as a solid block. All 229 affected SVGs, including 214 GCP
  icons, also failed to scale when the raw `svg` string was sized with CSS.

## 3.3.0

### Minor Changes

- [#890](https://github.com/glincker/thesvg/pull/890) [`49bc6c1`](https://github.com/glincker/thesvg/commit/49bc6c17a03c161dfa94bc33104d37be3c4591c4) Thanks [@thegdsks](https://github.com/thegdsks)! - Add @thesvg/react-native: typed, tree-shakeable icon components for React Native and Expo, backed by react-native-svg.
