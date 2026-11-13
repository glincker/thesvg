# @thesvg/flags

Country and region flags as plain SVG and React components. <!-- flags:count -->263<!-- /flags:count --> flags: every ISO 3166-1 country plus England, Scotland, Wales, Catalonia, the Basque Country, Galicia, the Valencian Community, the Balearic Islands, the Canary Islands, Corsica, Occitania, the European Union and the United Nations, each in three shapes: 4x3, square and circle.

Full guide: [docs/flags.md](../../docs/flags.md). Browse: [thesvg.org/collection/flags](https://thesvg.org/collection/flags).

## Install

```bash
npm i @thesvg/flags
```

React is an optional peer dependency (>=18), needed only for `@thesvg/flags/react`.

## Per-flag imports

```tsx
import { FlagUs } from "@thesvg/flags/react/us";
import { FlagGbEng } from "@thesvg/flags/react/gb-eng";

<FlagUs />
<FlagGbEng variant="circle" size={32} title="England" />
```

```ts
import { rect, square, circle } from "@thesvg/flags/flags/de"; // SVG strings
```

Raw files: `@thesvg/flags/svg/4x3/de.svg`, `@thesvg/flags/svg/1x1/de.svg`, `@thesvg/flags/svg/circle/de.svg`.

## Variants and props

| Variant | File | Ratio |
| --- | --- | --- |
| `4x3` (default) | `4x3/<code>.svg` | 4:3 |
| `square` | `1x1/<code>.svg` | 1:1 |
| `circle` | `circle/<code>.svg` | 1:1 |

Component props: `variant`, `size` (height in px, default 24), `width`, `height`, `title`, `className` and any other SVG attribute. Without `title` the flag is `aria-hidden`; with it the flag is `role="img"`.

## Metadata, search and locales

```ts
import { FLAGS, findFlags, getFlag } from "@thesvg/flags/search";
import { getFlagForLocale } from "@thesvg/flags";

findFlags("deutschland")[0].code; // "de"; also DEU, 276, holland, catalunya, pt-BR, emoji
getFlag("flag-gb-eng")?.name;     // "England"
getFlagForLocale("pt-BR");        // { slug: "flag-br", code: "br", name: "Brazil" }
```

A flag represents a country, not a language. Show the native language name beside it and keep the flag decorative (`aria-hidden`). Do not use flags as the only language selector.

## Bundle size

The package is `sideEffects: false` and every flag is its own module. Minified browser bundles measured with esbuild (React external), enforced by `budget.json` and `tests/bundle.test.ts`:

| You import | Bundle |
| --- | --- |
| one React component (`@thesvg/flags/react/us`) | about 3 KB |
| the same component through the `@thesvg/flags/react` barrel | about 3 KB (the other 257 are dropped) |
| one plain SVG string (`@thesvg/flags/flags/us`) | under 1 KB |
| `getFlagForLocale` from `@thesvg/flags` | about 5 KB |
| search and metadata for all flags (`@thesvg/flags/search`) | about 245 KB, load it only where you need search |

Bolivia, Spain, Montenegro, Mexico, Serbia and El Salvador are 55 to 180 KB in the 4x3 and square shapes because of their detailed coats of arms; their circle shapes are small.

## Exclusions

Not included: retired ISO codes, exceptionally reserved codes, Northern Ireland (no current official flag), disputed or unrecognized entities beyond what ISO and Kosovo require, subdivision flags such as US or Indian states, language flags, and novelty or historical flags. Wikimedia Commons files were consulted only as a cross-check and nothing was copied.

## License and attribution

Package code: MIT. The SVG artwork is derived from [flag-icons](https://github.com/lipis/flag-icons) and [circle-flags](https://github.com/HatScripts/circle-flags), both MIT. Their notices are in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md), which ships with the package. A flag is a public symbol of a state or organization; this package makes no claim about sovereignty. See LEGAL.md and DISCLAIMER.md in the repository.
