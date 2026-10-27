# @thesvg/preact

Typed Preact SVG components for all 7,600+ brand icons from [thesvg.org](https://thesvg.org).

- Zero runtime dependencies (`preact` is a peer dependency)
- Pre-compiled `h()` calls, no JSX transform needed to consume it
- Works with `preact-render-to-string` and hydration
- Props pass straight through to the `<svg>` element
- Tree-shakeable ESM plus CJS, one module per icon
- Gradient and mask ids are namespaced per render with `useId`, so icons never clash on one page

## Installation

```bash
pnpm add @thesvg/preact
```

```bash
npm install @thesvg/preact
```

Requires `preact` 10.11 or later (for `useId`).

## Usage

### Named import from the barrel

```tsx
import { Github, VisualStudioCode, Figma } from "@thesvg/preact";

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
import Github from "@thesvg/preact/github";
import VisualStudioCode from "@thesvg/preact/visual-studio-code";
```

### Selecting a variant

Many brands ship more than one mark. Pass `variant` to pick one. It defaults to `"default"` and is typed per icon.

```tsx
import { Github } from "@thesvg/preact";

<Github variant="mono" />;
```

### Sizing and color

Components have no fixed size. Set `width` and `height`, or size them with CSS. Monochrome artwork inherits `currentColor`, so `class="text-red-500"` recolors it.

### Refs

Preact does not pass `ref` to function components. To get the `<svg>` element, wrap the icon in an element you control, or use `forwardRef` from `preact/compat`.

## Naming

Component names are the PascalCase of the icon slug (`visual-studio-code` becomes `VisualStudioCode`). Slugs that start with a digit get an `I` prefix (`01dotai` becomes `I01Dotai`). Browse slugs at [thesvg.org](https://thesvg.org).

## Types

```ts
import type { SvgIconProps, SvgIconComponent } from "@thesvg/preact/types";
```

## License

The package is MIT. The brand marks are trademarks of their owners; see [thesvg.org](https://thesvg.org) for usage guidance.
