# @thesvg/ui-react-native

[![npm](https://img.shields.io/npm/v/@thesvg/ui-react-native?color=F97316&label=npm)](https://www.npmjs.com/package/@thesvg/ui-react-native)
[![downloads](https://img.shields.io/npm/dm/@thesvg/ui-react-native?color=F97316&label=downloads)](https://www.npmjs.com/package/@thesvg/ui-react-native)
[![license](https://img.shields.io/npm/l/@thesvg/ui-react-native?color=F97316)](https://github.com/glincker/thesvg/blob/main/LICENSE)

React Native components for the theSVG UI icons: 373 own icons in seven looks (outline, glass, duotone, offset, fill, glass outline, depth), typed and tree-shakeable, drawn with `react-native-svg`.

Part of [thesvg.org/ui](https://thesvg.org/ui), the open UI icon set for iOS and Android apps built with React Native and Expo.

## Features

- 373 own UI icons in five sets (core interface, space, wave 2, AI agents, theme), more every release
- Seven looks for every icon, so one drawing serves outline, glass, duotone, offset, fill, glass outline and depth designs
- `currentColor` everywhere: icons follow your text color and work in light and dark themes with no extra files
- Tree-shakeable, one file per icon, typed
- MIT licensed and free for personal and commercial use

## Install

```sh
npm install @thesvg/ui-react-native
```

```sh
pnpm add @thesvg/ui-react-native
```

```sh
yarn add @thesvg/ui-react-native
```

```sh
bun add @thesvg/ui-react-native
```
React Native 0.72 or later and `react-native-svg` 13 or later are peer dependencies (`npx expo install react-native-svg` in Expo projects).


## Usage

```tsx
import { BellIcon, BellGlassIcon, BellFillIcon } from "@thesvg/ui-react-native";

export function Header() {
  return (
    <>
      <BellIcon size={24} color="#111111" />
      <BellGlassIcon size={32} color="#27272a" />
      <BellFillIcon size={24} color="#f97316" />
    </>
  );
}
```

Pass `color` to set the ink. Unused looks are dropped by your bundler.


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

The lift `shadow` prop is not available in React Native, which has no CSS filters. Use your platform's shadow styles on the wrapping view.


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
