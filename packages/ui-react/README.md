# @thesvg/ui-react

[![npm](https://img.shields.io/npm/v/@thesvg/ui-react?color=F97316&label=npm)](https://www.npmjs.com/package/@thesvg/ui-react)
[![downloads](https://img.shields.io/npm/dm/@thesvg/ui-react?color=F97316&label=downloads)](https://www.npmjs.com/package/@thesvg/ui-react)
[![license](https://img.shields.io/npm/l/@thesvg/ui-react?color=F97316)](https://github.com/glincker/thesvg/blob/main/LICENSE)

React components for the theSVG UI icons: 373 own icons in seven looks (outline, glass, duotone, offset, fill, glass outline, depth), typed, tree-shakeable and themeable with `currentColor`.

Part of [thesvg.org/ui](https://thesvg.org/ui), the open UI icon set for React, Next.js and Vite apps.

## Features

- 373 own UI icons in five sets (core interface, space, wave 2, AI agents, theme), more every release
- Seven looks for every icon, so one drawing serves outline, glass, duotone, offset, fill, glass outline and depth designs
- `currentColor` everywhere: icons follow your text color and work in light and dark themes with no extra files
- Optional soft `shadow` that lifts any look
- Tree-shakeable, one file per icon, typed
- MIT licensed and free for personal and commercial use

## Install

```sh
npm install @thesvg/ui-react
```

```sh
pnpm add @thesvg/ui-react
```

```sh
yarn add @thesvg/ui-react
```

```sh
bun add @thesvg/ui-react
```
React 18 or later is a peer dependency.


## Usage

```tsx
import { BellIcon, BellGlassIcon, BellFillIcon } from "@thesvg/ui-react";

export function Header() {
  return (
    <nav className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
      <BellIcon size={20} />
      <BellGlassIcon size={32} shadow />
      <BellFillIcon size={20} aria-label="Notifications" />
    </nav>
  );
}
```

Icons render as plain `svg` elements, so any svg prop works (`className`, `onClick`, `aria-label`, refs). Icons without an `aria-label` are hidden from screen readers. They work as Server Components with no `"use client"`.

For the smallest bundles import from the icon's own file, which contains all seven looks:

```tsx
import { BellIcon, BellGlassIcon } from "@thesvg/ui-react/bell";
```


## Motion

Add `animated` to give an icon motion. It works on every look.

```tsx
<SunIcon animated />          {/* draw */}
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

`ThemeIcon` is a ready-made switcher icon: a sun for light, a moon for dark and a display for system. It plays the motion each time the theme changes.

```tsx
import { ThemeIcon } from "@thesvg/ui-react";

<ThemeIcon theme={theme} size={20} /> {/* "light" | "dark" | "system" */}
```

`IconSwap` cross-fades between two icons with a small turn and scale, for a toggle like menu and close, or play and pause:

```tsx
import { IconSwap, MenuIcon, XIcon } from "@thesvg/ui-react";

<IconSwap active={open} off={MenuIcon} on={XIcon} size={20} />
```

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

```tsx
<BellGlassIcon size={48} shadow />
<BellFillIcon size={48} shadow={0.5} />
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
