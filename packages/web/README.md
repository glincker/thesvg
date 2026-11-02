# @thesvg/web

Framework-free helper for [thesvg.org](https://thesvg.org) brand icons. Swap `<i data-thesvg="github"></i>` for inline SVG, or get SVG strings directly. Pure TypeScript, ESM and CJS, no runtime dependencies.

## Install

```bash
npm install @thesvg/web @thesvg/icons
```

`@thesvg/icons` is an optional peer dependency: this package only needs the icon modules you pass in, so bundlers keep just the icons you import.

## createIcons

```html
<i data-thesvg="github"></i>
<i data-thesvg="figma" data-thesvg-variant="mono" data-thesvg-size="32" class="logo"></i>
```

```ts
import { github, figma } from "@thesvg/icons";
import { createIcons } from "@thesvg/web";

createIcons({ icons: { github, figma } });
```

Options: `icons` (required), `nameAttr` (default `data-thesvg`), `root` (default `document`). Unknown names are left in place. `class` and other attributes on the placeholder carry over to the svg. Returns the number of elements replaced.

## getIconSvg

```ts
import { github } from "@thesvg/icons";
import { getIconSvg } from "@thesvg/web";

getIconSvg(github, { size: 24, className: "logo", title: "GitHub" });
getIconSvg("github", { icons: { github }, variant: "mono" });
```

Options: `icons`, `variant`, `size`, `className`, `title` (adds `role="img"` and `aria-label`, otherwise `aria-hidden`), `attrs`. Returns `undefined` for unknown icons.

Names resolve by key, camelCased key, or icon slug, so `1password` finds the `_1password` export.

## Related

`@thesvg/icons` (SVG strings), `@thesvg/react`, `@thesvg/static` (raw files for CDNs).

MIT. Brand marks remain the property of their owners.
