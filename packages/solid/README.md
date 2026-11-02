# @thesvg/solid

Typed Solid SVG components for all 7,600+ brand icons from [thesvg.org](https://thesvg.org).

- Zero runtime dependencies (`solid-js` is a peer dependency)
- Works with client rendering, SSR and hydration, no JSX compile step needed
- Props pass straight through to the `<svg>` element, including `class`, `style` and ARIA attributes
- Reactive `variant` prop
- Tree-shakeable ESM plus CJS, one module per icon
- Gradient and mask ids are namespaced per render, so icons never clash on one page

## Installation

```bash
pnpm add @thesvg/solid
```

```bash
npm install @thesvg/solid
```

Requires `solid-js` 1.8 or later.

## Usage

### Named import from the barrel

```tsx
import { Github, VisualStudioCode, Figma } from "@thesvg/solid";

export function Stack() {
  return (
    <div>
      <Github width={24} height={24} />
      <VisualStudioCode width={24} height={24} class="text-blue-500" />
      <Figma width={32} height={32} aria-label="Figma" />
    </div>
  );
}
```

### Individual import (smallest bundle)

```tsx
import Github from "@thesvg/solid/github";
import VisualStudioCode from "@thesvg/solid/visual-studio-code";
```

### Selecting a variant

Many brands ship more than one mark. Pass `variant` to pick one. It defaults to `"default"` and is typed per icon.

```tsx
import { Github } from "@thesvg/solid";

<Github variant="mono" />;
```

The prop is reactive, so a signal can drive it:

```tsx
<Github variant={dark() ? "dark" : "default"} />
```

### Sizing and color

Components have no fixed size. Set `width` and `height`, or size them with CSS. Monochrome artwork inherits `currentColor`, so `class="text-red-500"` recolors it.

## Naming

Component names are the PascalCase of the icon slug (`visual-studio-code` becomes `VisualStudioCode`). Slugs that start with a digit get an `I` prefix (`01dotai` becomes `I01Dotai`). Browse slugs at [thesvg.org](https://thesvg.org).

## Types

```ts
import type { SvgIconProps, SvgIconComponent } from "@thesvg/solid/types";
```

## License

The package is MIT. The brand marks are trademarks of their owners; see [thesvg.org](https://thesvg.org) for usage guidance.
