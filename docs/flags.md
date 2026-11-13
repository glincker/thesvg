# Flags

Country and region flags as SVG and components. <!-- flags:count -->263<!-- /flags:count --> flags: every ISO 3166-1 country (<!-- flags:iso -->250<!-- /flags:iso --> including Kosovo, which uses the user-assigned code XK) plus <!-- flags:extras -->13<!-- /flags:extras --> extras for locales and regions: England, Scotland, Wales, Catalonia, the Basque Country, Galicia, the Valencian Community, the Balearic Islands, the Canary Islands, Corsica, Occitania, the European Union and the United Nations. Each flag comes in three shapes, so <!-- flags:files -->789<!-- /flags:files --> SVG files in all.

Back to the [README](../README.md). Package details: [`@thesvg/flags`](../packages/flags/README.md).

## Naming

| Thing | Rule | Example |
| --- | --- | --- |
| Slug | `flag-` plus the lowercase ISO 3166-1 alpha-2 code | `flag-us`, `flag-de` |
| Regional slug | `flag-` plus the upstream region code | `flag-gb-eng`, `flag-es-ct`, `flag-eu`, `flag-un` |
| Category | `Flags` | |
| Collection | `flags` | thesvg.org/collection/flags |
| Variants | `default` is 4x3, `square` is 1x1, `circle` | `/icons/flag-us/circle.svg` |
| Package file | `4x3/`, `1x1/` or `circle/` plus the code | `@thesvg/flags/svg/circle/us.svg` |
| Component | `Flag` plus the code in PascalCase | `FlagUs`, `FlagGbEng` |

## Search

Every flag carries search aliases in its metadata, so the website, the CLI and the MCP server all find it the same way. Try any of these:

| Query | Finds |
| --- | --- |
| `deutschland`, `german`, `DEU`, `276` | Germany |
| `holland`, `nederland` | Netherlands |
| `england`, `st george` | England |
| `catalunya`, `catalan` | Catalonia |
| `pt-BR`, `brasil`, `BRA`, `076` | Brazil |
| a flag emoji | that flag |
| `burma`, `cote d ivoire`, `swaziland` | former and variant names |

Aliases cover the common English name, the native name, the official name, ISO alpha-2, alpha-3 and numeric codes, the emoji, former names, demonyms for common cases, and the locale tags (such as `pt-BR`) of the languages used there. Codes, numbers and emoji are exact identifiers and are listed first. Some words are shared and match more than one flag (`congo`, `guinea`, `korea`); the most specific match is first.

## Choosing a shape

| Shape | Use it for |
| --- | --- |
| 4x3 (`default`) | Tables, lists and anywhere the true proportions help recognition. |
| Square (`square`) | Fixed square slots such as avatars, grid cells and list icons where you do not want rounding. |
| Circle | Compact pickers, chips and badges. Cropping loses the edges of wide flags, so keep the name in text beside it. |

Note: the Swiss and Vatican flags are square, and Nepal's flag is not a rectangle; the 4x3 files include the padding from the source so every flag sits in the same frame.

## Size, title and class (React)

```tsx
import { FlagUs } from "@thesvg/flags/react/us";

<FlagUs />                                   // decorative, 24px tall, 32px wide
<FlagUs size={32} variant="circle" />        // size is the rendered height
<FlagUs width={64} height={48} />            // explicit width and height win
<FlagUs title="United States" />             // standalone flag: becomes role="img" with a name
<FlagUs className="rounded-sm shadow-sm" />  // any SVG prop works, Tailwind classes included
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `variant` | `"4x3"` | `"4x3"`, `"square"` or `"circle"`. |
| `size` | `24` | Height in px. Width is 4:3 for `4x3`, 1:1 otherwise. |
| `width`, `height` | | Override `size`. |
| `title` | none | Accessible name. Omit it for decorative use. |
| `className` and other SVG props | | Passed to the `<svg>`. |

## Accessibility

- Decorative flags are `aria-hidden`. This is the default. The visible text carries the meaning: write the country or language name next to the flag.
- Give a `title` only when the flag stands alone (an icon-only button, for example). It then renders `role="img"` with an accessible name.
- Do not rely on colour or the flag alone to convey anything.

## A flag is a country, not a language

- Show the native language name next to the flag: `Deutsch`, `Español`, `Français`, not just a flag.
- Do not use flags as the only language selector. Many languages span countries (Spanish, English, Arabic) and many countries use several languages. Which flag stands for "English"?
- `getFlagForLocale(locale)` returns a conventional flag for a locale, to use as decoration next to that name:

<!-- flags:locale-table -->
| Locale | Flag |
| --- | --- |
| `en` | `flag-us` |
| `en-gb` | `flag-gb` |
| `es` | `flag-es` |
| `es-mx` | `flag-mx` |
| `de` | `flag-de` |
| `fr` | `flag-fr` |
| `pt-br` | `flag-br` |
| `pt-pt` | `flag-pt` |
| `ja` | `flag-jp` |
| `zh-cn` | `flag-cn` |
| `zh-tw` | `flag-tw` |
| `ar` | `flag-sa` |
| `hi` | `flag-in` |
| `ru` | `flag-ru` |
| `ko` | `flag-kr` |
| `it` | `flag-it` |
| `nl` | `flag-nl` |
| `pl` | `flag-pl` |
| `tr` | `flag-tr` |
| `id` | `flag-id` |
| `ca` | `flag-es-ct` |
| `eu` | `flag-es-pv` |
| `gl` | `flag-es-ga` |
| `cy` | `flag-gb-wls` |
| `gd` | `flag-gb-sct` |
<!-- /flags:locale-table -->

```ts
import { getFlagForLocale } from "@thesvg/flags/locale";

getFlagForLocale("pt-BR"); // { slug: "flag-br", code: "br", name: "Brazil" }
getFlagForLocale("fr-CA"); // region subtag wins: Canada
getFlagForLocale("xx");    // undefined, show text only
```

Resolution order: the exact locale mapping, then the region subtag (`fr-CA` gives Canada), then the bare language mapping. Regional languages map to regional flags (`ca` to Catalonia, `cy` to Wales).

## Legal and contested territories

- A flag is a public symbol of a state or organization. The MIT license covers the SVG drawings from the source projects, not any right in the symbol itself. See [LEGAL.md](../LEGAL.md), [DISCLAIMER.md](../DISCLAIMER.md) and [TRADEMARK.md](../TRADEMARK.md).
- Including a flag is not a statement about sovereignty or borders. The ISO 3166-1 list is the baseline; Kosovo is included because it has a widely used user-assigned code and a clean source. Entities outside that, such as disputed or self-declared states, are not included. See the exclusions in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) and the package README.
- Flags that changed recently follow the upstream sources; report a stale one as an issue.
- Do not use a flag to imply endorsement by a government or organization.

## Performance

- Import one flag at a time (`@thesvg/flags/react/us`). The package is `sideEffects: false`, so a bundler keeps only what you import.
- Plain SVG strings are available per flag (`@thesvg/flags/flags/us`) with no React.
- For lists of many flags, use `<img src>` pointing at the CDN or your own copy of the file, not inline SVG, so the browser can cache and lazy-load them. A few of the flags with detailed coats of arms (Bolivia, Spain, Montenegro, Mexico, Serbia, El Salvador) are 55 to 180 KB in the 4x3 and square shapes; the circle shapes are small. Prefer `circle` or lazy loading in long lists. There is no sprite option.

## Examples

React:

```tsx
import { FlagDe } from "@thesvg/flags/react/de";

<span className="inline-flex items-center gap-2"><FlagDe /> Deutsch</span>
```

Vue (raw SVG string):

```vue
<script setup lang="ts">
import { rect } from "@thesvg/flags/flags/de";
</script>
<template>
  <span class="inline-flex items-center gap-2"><span class="h-4 w-5" aria-hidden="true" v-html="rect" /> Deutsch</span>
</template>
```

Svelte (raw SVG string):

```svelte
<script lang="ts">
  import { circle } from "@thesvg/flags/flags/de";
</script>
<span class="inline-flex items-center gap-2"><span class="h-5 w-5" aria-hidden="true">{@html circle}</span> Deutsch</span>
```

Plain HTML or `<img>`:

```html
<img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/flag-de/circle.svg" width="24" height="24" alt="" /> Deutsch
```

CLI and MCP:

```bash
npx @thesvg/cli search deutschland
npx @thesvg/cli add flag-de --variant circle
```

The MCP `search_icons` and `get_icon` tools return the `default`, `square` and `circle` variants for any `flag-*` slug.

## Sources and licenses

SVG drawings come from [flag-icons](https://github.com/lipis/flag-icons) (4x3 and square) and [circle-flags](https://github.com/HatScripts/circle-flags) (circle), both MIT. The exact commits, access dates and license texts are in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md), and `packages/flags/src/data/licenses.json` maps every file to its upstream path. Everything here is produced by `scripts/flags/generate-flags.mjs`; do not edit generated files by hand.

## Colors

Every flag carries a palette extracted from its 4x3 artwork: up to <!-- flags:palette-max -->6<!-- /flags:palette-max --> colors in painted-area order, merged when within a small RGB distance.

| Field | Where | Meaning |
| --- | --- | --- |
| `colors` | `@thesvg/flags/search` metadata | `[{ hex, share }]`, hex without `#`, share in percent. |
| `colorNames` | same | Families with at least 5 percent share: red, orange, gold, yellow, green, blue, purple, pink, brown, black, white, gray. |
| `hex` | `icons.json` | The dominant non-white color of the design. |
| `collectionMeta.colors` | `icons.json` | Compact `"hex:share"` strings. |

Family rule (HSL): lightness under 0.12 is black and over 0.93 is white; saturation under 0.12 is gray (or black or white at the extremes); then hue picks red (345 to 15, pink when very light), orange (15 to 38), gold (38 to 52, yellow when light), yellow (52 to 70), green (70 to 170), blue (170 to 255), purple (255 to 315) and pink (315 to 345); dark low-saturation oranges are brown. The rule lives in `scripts/flags/colors.mjs` and is tested.

Search finds flags by color words and codes: `red white blue`, `ed2939`, `#ed2939`, `tricolor`. Example, tint a language picker row with the dominant color:

```tsx
import { findFlags } from "@thesvg/flags/search";

const [de] = findFlags("de");
const accent = `#${de.colors[0].hex}`; // use as a border or underline, and check contrast first
```

## The Flags browser

`/collection/flags` and the try-it section of `/docs/flags` share one browser. Everything personal stays in your browser (localStorage, no network, no tracking).

- Filter by region (Africa, Americas, Asia, Europe, Oceania, Antarctica, Regional, International), by color family (any or all), or by a color near a hex with a tolerance. Search uses the alias search described above and loads its alias file on first use.
- Switch every tile between 4x3, square and circle, pick size S, M or L, and sort A to Z, by region, by ISO code or by color. The result count updates live and an empty state explains what to change.
- The "Your flag" card guesses a flag from `navigator.languages`, on your device only, with one-click copy of the import and the SVG. Variant, size, region and sort are remembered, as are recently viewed and starred flags (caps `NEXT_PUBLIC_FLAGS_RECENT_MAX` and `NEXT_PUBLIC_FLAGS_STAR_MAX`).
- "Flags for languages" lists the mapped locales with the native language name beside each flag, to show the country-not-language rule.
- Click a flag for all three shapes, copy buttons (React import, install, img tag, slug, SVG), downloads, swatches with hex, rgb and hsl, the license note and flags from the same region.
- Arrow keys, Home and End move between tiles, Enter opens details, S stars. Filters and the open flag live in the URL (`?q=`, `?region=`, `?variant=`, `?size=`, `?sort=`, `?colors=`, `?near=`, `?flag=`), so a view is shareable and the back button works.

## Flags are a separate package

Flags are in the shared catalog (website, search, CLI, MCP, CDN) but not bundled into `@thesvg/icons` or the framework packages. Need only flags? Install `@thesvg/flags`. Need everything else? Use `@thesvg/icons` or your framework package.
