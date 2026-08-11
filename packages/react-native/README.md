<p align="center">
  <a href="https://github.com/glincker/thesvg">
    <img src="https://raw.githubusercontent.com/glincker/thesvg/main/public/og-image.png" alt="theSVG - 6,500+ Brand SVG Icons" width="700" />
  </a>
</p>

# @thesvg/react-native

Typed React Native SVG components for all 6,500+ brand icons from [thesvg.org](https://thesvg.org).

- Renders via [`react-native-svg`](https://github.com/software-mansion/react-native-svg) (peer dependency)
- Works in **Expo Go** with no config plugin and no native setup
- Data-driven icons: each icon is a small render-tree, shared by one runtime component (not one generated component per icon), so bundle size scales with icon count, not with duplicated render logic
- TypeScript strict mode with typed per-icon `variant` props
- `forwardRef` on every component
- Tree-shakeable ESM, plus individual per-icon subpath imports for bundlers that don't tree-shake

## Installation

```bash
npm install @thesvg/react-native react-native-svg
```

```bash
pnpm add @thesvg/react-native react-native-svg
```

```bash
yarn add @thesvg/react-native react-native-svg
```

`react-native-svg` is required as a peer dependency. It works in Expo Go
without a config plugin or any native/autolinking setup, and as a Turbo
Module in bare React Native apps.

## Usage

### Named import from barrel (convenient, relies on tree-shaking)

```tsx
import { Github, VisualStudioCode, Figma } from '@thesvg/react-native';

export function MyComponent() {
  return (
    <>
      <Github size={24} />
      <VisualStudioCode size={24} color="#3b82f6" />
      <Figma size={32} />
    </>
  );
}
```

### Individual icon import (best for bundle size)

```tsx
import Github from '@thesvg/react-native/icons/github';
import VisualStudioCode from '@thesvg/react-native/icons/visual-studio-code';
```

Each icon is a separate module (pure render-tree data plus a reference to
the shared runtime), so bundlers that don't support tree-shaking
(e.g. CommonJS/Metro without tree-shaking) still only ship the icons you
import.

### Selecting a variant

Many brands ship more than one mark (a monochrome version, a wordmark, a
light/dark optimized variant). Pass the `variant` prop to choose one. It
defaults to `"default"`, so existing usage is unchanged:

```tsx
import { Github } from '@thesvg/react-native';

<Github />                    {/* default mark */}
<Github variant="mono" />     {/* monochrome */}
<Github variant="wordmark" /> {/* text logo */}
```

The accepted variant names are typed per icon, so your editor autocompletes
only the variants that icon actually has, and an unknown variant is a type
error. At runtime an unrecognized variant safely falls back to `"default"`.

### With Expo

No config plugin, no `expo prebuild` step, no native module linking. Works
in Expo Go out of the box because `react-native-svg` ships a Turbo Module
that Expo Go already includes:

```tsx
import { Github, Figma } from '@thesvg/react-native';

export default function Screen() {
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Github size={28} />
      <Figma size={28} />
    </View>
  );
}
```

## Props

Every component accepts `react-native-svg`'s `SvgProps`, plus two shorthands:

| Prop        | Type               | Default              | Description                                          |
| ----------- | ------------------ | --------------------- | ----------------------------------------------------- |
| `size`      | `number \| string` | `24`                   | Shorthand for both `width` and `height`                |
| `color`     | `string`            | -                      | Shorthand that sets both `fill` and `stroke`           |
| `width`     | `number \| string` | `size`, else `24`      | Overrides `size` for width only                        |
| `height`    | `number \| string` | `size`, else `24`      | Overrides `size` for height only                       |
| `fill`      | `string`            | from source SVG        | Overrides `color` for fill only                        |
| `stroke`    | `string`            | from source SVG        | Overrides `color` for stroke only                      |
| `variant`   | `string`            | `"default"`             | Which icon variant to render (per-icon typed union)    |
| `ref`       | `Ref<Svg>`          | -                      | Forwarded ref to the underlying `react-native-svg` root |
| ...         | ...                 | -                      | Any other `SvgProps` from `react-native-svg`            |

```tsx
// Fixed size
<Github size={24} />

// Explicit width/height
<Github width={32} height={24} />

// Recolor via the color shorthand
<Github color="#3b82f6" />

// Fine-grained control
<Github fill="#3b82f6" stroke="#1d4ed8" strokeWidth={0.5} />
```

## Component names

Slugs are converted to PascalCase component names:

| Slug                  | Component name         |
| ---------------------- | ----------------------- |
| `github`                | `Github`                  |
| `visual-studio-code`    | `VisualStudioCode`        |
| `figma`                 | `Figma`                   |
| `01dotai`               | `I01Dotai`                |
| `dotnet`                | `Dotnet`                  |

Slugs that start with a digit are prefixed with `I` to produce a valid
JavaScript identifier.

## Architecture

Unlike [`@thesvg/react`](https://www.npmjs.com/package/@thesvg/react), which
generates one self-contained inline component per icon, this package follows
the same pattern as [`lucide-react-native`](https://github.com/lucide-icons/lucide):

- Each icon compiles to a small data tree of `[tagName, props, children]`
  tuples extracted from its SVG.
- A single shared runtime (`createIcon`, exported from `@thesvg/react-native/createIcon`)
  resolves each tag name against `react-native-svg`'s exports (`Path`,
  `Circle`, `G`, `Defs`, `LinearGradient`, ...) and renders it.

This keeps per-icon modules to just data, so bundle size scales with icon
count instead of with duplicated render logic across 6,500+ files.

Supported SVG elements: `path`, `circle`, `rect`, `ellipse`, `line`,
`polygon`, `polyline`, `g`, `defs`, `linearGradient`, `radialGradient`,
`stop`, `clipPath`, `mask`, `use`, `text`, `tspan`. Elements with no
`react-native-svg` equivalent (`filter` and its primitives, `style`,
`title`, `desc`, `script`) are stripped at build time; any other unsupported
wrapper element has its children kept and only the wrapper itself dropped,
so visual content is never silently lost.

## Compatibility

| Environment       | Version | Status    |
| ------------------ | ------- | --------- |
| React               | 18, 19  | Supported |
| React Native        | 0.70+   | Supported |
| Expo (Expo Go)      | SDK 49+ | Supported, no config plugin needed |
| react-native-svg    | 13+     | Required peer dependency |
| Node.js             | 18+     | Supported |

## Available icons

Over 6,500 brand icons are available. Browse the full list at
[thesvg.org](https://thesvg.org).

## License

MIT - see [LICENSE](./LICENSE).

Brand icons and logos are the property of their respective trademark holders. See [thesvg.org](https://thesvg.org) for details.
