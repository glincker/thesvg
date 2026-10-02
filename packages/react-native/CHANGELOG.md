# @thesvg/react-native

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
