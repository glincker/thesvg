# @thesvg/ui-svelte

## 4.3.0

### Minor Changes

- [#1445](https://github.com/glincker/thesvg/pull/1445) [`cc053a3`](https://github.com/glincker/thesvg/commit/cc053a35f3e17c54820bf1744748d95b68b0e4d4) Thanks [@thegdsks](https://github.com/thegdsks)! - Motion presets. `animated` now takes a preset: `draw` (what `animated` alone means), `pop`, `bounce`, `ring`, `spin` and `pulse`, on the React, Vue and Svelte components and on every look. New `IconSwap` for React cross-fades between two icons, for toggles like menu and close. Loader, refresh, heart and bell join sun, moon and theme-system with ready-made `-animated.svg` files. Plain CSS inside the SVG, tree-shakeable, and it respects reduced motion.

## 4.2.0

### Minor Changes

- [#1442](https://github.com/glincker/thesvg/pull/1442) [`177b1c8`](https://github.com/glincker/thesvg/commit/177b1c83ef0b2cff5e60008cb9d7273721309e1c) Thanks [@thegdsks](https://github.com/thegdsks)! - Animated theme icons. New `theme-system` icon (373 icons now), an `animated` prop on the React, Vue and Svelte components that pops an icon in and draws its strokes, a `ThemeIcon` for React that shows sun, moon or a display and replays the motion when the theme changes, and `-animated.svg` files for sun, moon and theme-system. The motion is plain CSS inside the SVG and respects reduced motion.

## 4.1.0

### Minor Changes

- [#1436](https://github.com/glincker/thesvg/pull/1436) [`f9ec309`](https://github.com/glincker/thesvg/commit/f9ec3096b0ec335023b49b9454559f47b46b22a5) Thanks [@thegdsks](https://github.com/thegdsks)! - 372 UI icons (up from 129) in four sets, the new glass-outline look in place of pixel, and a `shadow` prop on the React, Vue and Svelte components that lifts any look. Cleaner arrow tips, cut-end strokes and glass shading.

## 4.0.0

### Major Changes

- Initial release, part of theSVG 4.0. Ships the 129 UI icons as tree-shakeable Svelte components (outline, glass, duotone, offset, fill, pixel and depth). Brand icons stay in their own packages.
