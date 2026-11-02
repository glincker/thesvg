# @thesvg/ui-vue

[![npm](https://img.shields.io/npm/v/@thesvg/ui-vue?color=F97316&label=npm)](https://www.npmjs.com/package/@thesvg/ui-vue)
[![downloads](https://img.shields.io/npm/dm/@thesvg/ui-vue?color=F97316&label=downloads)](https://www.npmjs.com/package/@thesvg/ui-vue)
[![license](https://img.shields.io/npm/l/@thesvg/ui-vue?color=F97316)](https://github.com/glincker/thesvg/blob/main/LICENSE)

Vue 3 components for the theSVG UI icons: 373 own icons in seven looks (outline, glass, duotone, offset, fill, glass outline, depth), typed, tree-shakeable and themeable with `currentColor`.

Part of [thesvg.org/ui](https://thesvg.org/ui), the open UI icon set for Vue and Nuxt apps.

## Features

- 373 own UI icons in five sets (core interface, space, wave 2, AI agents, theme), more every release
- Seven looks for every icon, so one drawing serves outline, glass, duotone, offset, fill, glass outline and depth designs
- `currentColor` everywhere: icons follow your text color and work in light and dark themes with no extra files
- Optional soft `shadow` that lifts any look
- Tree-shakeable, one file per icon, typed
- MIT licensed and free for personal and commercial use

## Install

```sh
npm install @thesvg/ui-vue
```

```sh
pnpm add @thesvg/ui-vue
```

```sh
yarn add @thesvg/ui-vue
```

```sh
bun add @thesvg/ui-vue
```
Vue 3.3 or later is a peer dependency.


## Usage

```vue
<script setup lang="ts">
import { BellIcon, BellGlassIcon, BellFillIcon } from "@thesvg/ui-vue";
</script>

<template>
  <nav class="flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
    <BellIcon :size="20" />
    <BellGlassIcon :size="32" shadow />
    <BellFillIcon :size="20" aria-label="Notifications" />
  </nav>
</template>
```

Any svg attribute passes through. Icons without an `aria-label` are hidden from screen readers. For the smallest bundles import from the icon's own file:

```ts
import { BellIcon, BellGlassIcon } from "@thesvg/ui-vue/bell";
```


## Motion

Add `animated` to give an icon motion. It works on every look.

```vue
<SunIcon animated />
<LoaderCircleIcon animated="spin" />
<BellIcon animated="ring" />
```

| `animated` | Motion |
| --- | --- |
| `true` or `"draw"` | Pops in with a spring and draws the strokes one after another, once |
| `"pop"` | The spring only, once |
| `"bounce"` | A short hop, once |
| `"ring"` | A swing from the top, once. Made for a bell |
| `"spin"` | Turns forever. Made for loaders |
| `"pulse"` | Breathes forever. Made for a heart |

It is plain CSS inside the SVG: no animation library, and it stands still for people who prefer reduced motion. Import only the icons you use, for example `import { BellIcon } from "@thesvg/ui-react/bell"`. The motion code is one small helper (about 1.6 KB gzipped) shared by every icon, and an icon you never animate carries no motion CSS.

## Looks

Every icon ships in all seven looks. Outline is the plain name, every other look adds its name to the export.

| Look | Export | What it is |
| --- | --- | --- |
| Outline | `BellIcon` | Clean stroke, the default |
| Glass | `BellGlassIcon` | Frosted pane that thins towards the lower right |
| Duotone | `BellDuotoneIcon` | Stroke over a soft back layer |
| Offset | `BellOffsetIcon` | Back layer shifted for a layered feel |
| Fill | `BellFillIcon` | Solid silhouette for active states |
| Glass outline | `BellGlassOutlineIcon` | Crisp outline, translucent pane, thin highlight |
| Depth | `BellDepthIcon` | Extruded, for hero spots |

Preview every icon in every look, change weight and corners live, and copy the code at [thesvg.org/ui](https://thesvg.org/ui).

## Lift shadow

Add `shadow` to lift any look off the page with a soft shadow that follows the icon color: `shadow` for the default strength, or a number from 0 to 1 for the opacity.

```vue
<BellGlassIcon :size="48" shadow />
<BellFillIcon :size="48" :shadow="0.5" />
```


## Icon sets

| Set | Icons | Covers |
| --- | --- | --- |
| Launch | 121 | The most used interface icons: arrows, status, files, search, settings |
| Wave 2 | 171 | The next most used icons: charts, devices, layout, nature, tools |
| Agents | 40 | Agent runs, tools, memory, guardrails and evals |
| Space | 40 | Telemetry, orbit, actuators and sensors |
| Theme | 1 | The system icon, next to sun and moon, with motion |

Search by name or tag at [thesvg.org/ui](https://thesvg.org/ui). Missing an icon? [Submit one](https://thesvg.org/submit).

## Related packages

- [@thesvg/ui](https://www.npmjs.com/package/@thesvg/ui): raw SVG files and a JSON manifest for every look
- [@thesvg/ui-react](https://www.npmjs.com/package/@thesvg/ui-react), [@thesvg/ui-vue](https://www.npmjs.com/package/@thesvg/ui-vue), [@thesvg/ui-svelte](https://www.npmjs.com/package/@thesvg/ui-svelte), [@thesvg/ui-react-native](https://www.npmjs.com/package/@thesvg/ui-react-native): components for each framework
- [theSVG brand icons](https://thesvg.org): 7,600+ brand logos as SVG, React, Vue, Svelte, CDN, CLI and MCP
- [Docs](https://thesvg.org/docs), [GitHub](https://github.com/glincker/thesvg), [report an issue](https://github.com/glincker/thesvg/issues)

## License

[MIT](https://github.com/glincker/thesvg/blob/main/LICENSE) by [theSVG](https://thesvg.org).
