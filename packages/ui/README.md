# @thesvg/ui

[![npm](https://img.shields.io/npm/v/@thesvg/ui?color=F97316&label=npm)](https://www.npmjs.com/package/@thesvg/ui)
[![downloads](https://img.shields.io/npm/dm/@thesvg/ui?color=F97316&label=downloads)](https://www.npmjs.com/package/@thesvg/ui)
[![license](https://img.shields.io/npm/l/@thesvg/ui?color=F97316)](https://github.com/glincker/thesvg/blob/main/LICENSE)

The theSVG UI icons as raw SVG files: 373 own icons in seven looks (outline, glass, duotone, offset, fill, glass outline, depth), plus a JSON manifest. Every icon uses `currentColor`, so it follows your theme.

Part of [thesvg.org/ui](https://thesvg.org/ui), the open UI icon set. Use it for build pipelines, icon fonts, design tools and anything that wants plain SVG.

## Features

- 373 own UI icons in five sets (core interface, space, wave 2, AI agents, theme), more every release
- Seven looks for every icon, so one drawing serves outline, glass, duotone, offset, fill, glass outline and depth designs
- `currentColor` everywhere: icons follow your text color and work in light and dark themes with no extra files
- One file per icon and look, plus a JSON manifest with names, tags and sets
- MIT licensed and free for personal and commercial use

## Install

```sh
npm install @thesvg/ui
```

```sh
pnpm add @thesvg/ui
```

```sh
yarn add @thesvg/ui
```

```sh
bun add @thesvg/ui
```

## Usage

```js
import manifest from "@thesvg/ui/ui-icons.json" with { type: "json" };
// SVG files: @thesvg/ui/svg/<slug>/<look>.svg
```

Use a file straight from a CDN:

```html
<img src="https://cdn.jsdelivr.net/npm/@thesvg/ui/dist/svg/bell/glass-outline.svg" width="24" height="24" alt="" />
```

Inline the SVG when you want the icon to take the text color, since `currentColor` does not pass through `<img>`.


## Animated files

Sun, moon and `theme-system` also ship as `<look>-animated.svg`. They pop in and draw their strokes once when they load, which works in an `<img>` tag too:

```html
<img src="https://cdn.jsdelivr.net/npm/@thesvg/ui/dist/svg/theme-system/outline-animated.svg" width="24" height="24" alt="" />
```

The motion stands still for people who prefer reduced motion. To animate when a theme changes, use the `animated` prop in `@thesvg/ui-react`, `@thesvg/ui-vue` or `@thesvg/ui-svelte`.

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

Looks in file names are `outline`, `glass`, `duotone`, `offset`, `fill`, `glass-outline` and `depth`.


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

- [@thesvg/ui-react](https://www.npmjs.com/package/@thesvg/ui-react), [@thesvg/ui-vue](https://www.npmjs.com/package/@thesvg/ui-vue), [@thesvg/ui-svelte](https://www.npmjs.com/package/@thesvg/ui-svelte), [@thesvg/ui-react-native](https://www.npmjs.com/package/@thesvg/ui-react-native): components for each framework
- [theSVG brand icons](https://thesvg.org): 7,600+ brand logos as SVG, React, Vue, Svelte, CDN, CLI and MCP
- [Docs](https://thesvg.org/docs), [GitHub](https://github.com/glincker/thesvg), [report an issue](https://github.com/glincker/thesvg/issues)

## License

[MIT](https://github.com/glincker/thesvg/blob/main/LICENSE) by [theSVG](https://thesvg.org).
