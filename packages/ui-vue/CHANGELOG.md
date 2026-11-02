# @thesvg/ui-vue

## 4.4.0

### Minor Changes

- [#1454](https://github.com/glincker/thesvg/pull/1454) [`3c6b26c`](https://github.com/glincker/thesvg/commit/3c6b26c40f2d0aebc1fbcf009a67bbc26a10ee33) Thanks [@thegdsks](https://github.com/thegdsks)! - A new Social category with 56 icons: marks for the networks developers use (GitHub, X, LinkedIn, YouTube, Discord, Reddit and more) and social interactions such as repost, quote post, hashtag and follow.

- [#1448](https://github.com/glincker/thesvg/pull/1448) [`6575593`](https://github.com/glincker/thesvg/commit/65755931ea67497df9dde2a9c09ea6d8863b2e09) Thanks [@thegdsks](https://github.com/thegdsks)! - 497 more UI icons (870 in total), covering space, robotics, agents, infrastructure and interface staples. The outline and glass-outline looks now fill the 24 px box like the glass look, so icons read larger and consistent across looks. The manifest gains a `domain`, `concept` and `modifiers` for every icon.

- [#1450](https://github.com/glincker/thesvg/pull/1450) [`30e9b35`](https://github.com/glincker/thesvg/commit/30e9b35f9d79919345a6586a31edcc3b47a37ff6) Thanks [@thegdsks](https://github.com/thegdsks)! - 265 more UI icons (1,133 in total): interface patterns, developer workflow, cloud and infrastructure, data, agents, robotics and space. Seventeen wave 3 icons are redrawn so they read more clearly and stand apart from common artwork.

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

- Initial release, part of theSVG 4.0. Ships the 129 UI icons as tree-shakeable Vue components (outline, glass, duotone, offset, fill, pixel and depth). Brand icons stay in their own packages.
