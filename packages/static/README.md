# @thesvg/static

Raw SVG files for every brand icon variant from [thesvg.org](https://thesvg.org), plus a JSON manifest. Built for CDNs, plain HTML, CSS, and anything that is not JavaScript.

## Layout

```
dist/icons.json            manifest: slug, title, hex, categories, variants
dist/svg/<slug>/<file>.svg one file per variant
```

Each manifest entry maps variant names to paths relative to `dist/svg/`:

```json
{ "slug": "github", "title": "GitHub", "hex": "181717", "categories": ["DevTool"], "variants": { "default": "github/default.svg", "mono": "github/mono.svg" } }
```

## CDN usage

```html
<img src="https://cdn.jsdelivr.net/npm/@thesvg/static/dist/svg/github/default.svg" alt="GitHub" width="32" height="32" />
<img src="https://unpkg.com/@thesvg/static/dist/svg/github/mono.svg" alt="GitHub" width="32" height="32" />
```

Pin a version in production:

```
https://cdn.jsdelivr.net/npm/@thesvg/static@4.0.0/dist/svg/github/default.svg
https://cdn.jsdelivr.net/npm/@thesvg/static@4.0.0/dist/icons.json
```

CSS:

```css
.logo { background: url("https://cdn.jsdelivr.net/npm/@thesvg/static/dist/svg/github/default.svg") center / contain no-repeat; }
```

## Node usage

```js
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const manifest = require("@thesvg/static/icons.json");
const github = manifest.find((i) => i.slug === "github");
// file on disk: require.resolve("@thesvg/static/svg/github/default.svg")
```

## Build

```bash
pnpm --filter @thesvg/static build   # copies SVGs from public/icons into dist
pnpm --filter @thesvg/static test    # build plus manifest vs registry count check
```

For inline SVG in JS see `@thesvg/web`, `@thesvg/icons` and `@thesvg/react`.

MIT. Brand marks remain the property of their owners.
