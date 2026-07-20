# @thesvg/react

## 3.2.12

### Patch Changes

- feat: add icon Yapi Kredi ([#800](https://github.com/glincker/thesvg/issues/800))

## 3.2.11

### Patch Changes

- feat: add Microsoft Fabric, Power BI and OneLake icons ([#797](https://github.com/glincker/thesvg/issues/797))

## 3.2.10

### Patch Changes

- feat: add Microsoft Purview and Fabric Data Warehouse icons ([#794](https://github.com/glincker/thesvg/issues/794))

## 3.2.9

### Patch Changes

- feat: add Ngern Tid Lor icon ([#791](https://github.com/glincker/thesvg/issues/791))

## 3.2.8

### Patch Changes

- feat: add Edison icon ([#746](https://github.com/glincker/thesvg/issues/746))

## 3.2.7

### Patch Changes

- [#743](https://github.com/glincker/thesvg/pull/743) [`843dfae`](https://github.com/glincker/thesvg/commit/843dfae067971fa9e8d6ccf5e1220c8e5dbc38f1) Thanks [@thegdsks](https://github.com/thegdsks)! - Include wordmarkMono, wordmarkLight, and wordmarkDark variants in generated React components

  The codegen reconstructed each variant's SVG filename from its camelCase
  key (`wordmarkLight` -> `wordmarkLight.svg`), but those files are stored
  kebab-case on disk (`wordmark-light.svg`), so the variant silently failed
  to load and was dropped from the component's variant union entirely.
  icons.json already records the correct path for every variant; the codegen
  now reads that path directly instead of reconstructing it. Fixes 221
  missing variants across 70+ icons, including Apple Music, Zoom, TikTok,
  Vercel, and YouTube. Fixes [#740](https://github.com/glincker/thesvg/issues/740).

## 3.2.6

### Patch Changes

- feat: add pixelos icon ([#734](https://github.com/glincker/thesvg/issues/734))

## 3.2.5

### Patch Changes

- feat: add Siket icon ([#720](https://github.com/glincker/thesvg/issues/720))

## 3.2.4

### Patch Changes

- feat: add zoom-2025 (new Zoom wordmark logo) ([#697](https://github.com/glincker/thesvg/issues/697))

## 3.2.2

### Patch Changes

- [#670](https://github.com/glincker/thesvg/pull/670) [`8c39e6c`](https://github.com/glincker/thesvg/commit/8c39e6cf7f3e3ef418fb3824edcb0ec6e185fc87) Thanks [@thegdsks](https://github.com/thegdsks)! - Quality pass: lint hygiene, search fixes, and a correct React validator

  - **Lint**: ignore generated extension build dirs (`.output`, `.wxt`, `build`) so
    ESLint stops scanning them. This drops the repo from 2361 problems (4 errors)
    to 13 (0 errors, all intentional). Also removed genuinely dead imports/vars,
    redundant eslint-disable directives, and hoisted a `PLACEHOLDER_BRANDS`
    constant to module scope (fixes an exhaustive-deps warning).
  - **Search UX**: a single character no longer blanks the icon grid (aligned with
    Fuse's `minMatchCharLength`), and the Fuse index is no longer rebuilt on every
    keystroke while a category/favorites filter is active (memoized search base).
  - **Manifest recovery**: a transient icon-manifest load failure now clears when
    filters change, so the grid recovers without a full page reload.
  - **@thesvg/react validator**: `validate-output.ts` compared the source SVG root
    fill against a `<svg>` tag that no longer exists in the compiled
    `createElement` output, producing 3185 false "fill -> none" errors. It now
    reads the root paint from the serialized `_variants` object and mirrors the
    build's default-fill logic. The build also cleans `dist` first so orphaned
    components from removed slugs no longer ship or trip the validator. Validator
    now passes on all 6,415 components.

## 3.2.0

### Minor Changes

- [#661](https://github.com/glincker/thesvg/pull/661) [`3609a5f`](https://github.com/glincker/thesvg/commit/3609a5f05f2592e0e4e3c15fe1429fa0e2e73de4) Thanks [@thegdsks](https://github.com/thegdsks)! - Onboard Affinity, Outlook Calendar, and Samsung Browser icons; fix Audible source URL

  Adds three community-requested brand icons (Affinity, Outlook Calendar, Samsung Browser)
  with normalized slugs, corrected brand hex values, and valid categories. Also corrects
  the Audible entry URL to the official brand site.

### Patch Changes

- [#662](https://github.com/glincker/thesvg/pull/662) [`6f39a31`](https://github.com/glincker/thesvg/commit/6f39a3110631da77a402cb9e751287240a3f152e) Thanks [@thegdsks](https://github.com/thegdsks)! - Preserve data-_ and aria-_ attributes in generated React components

  The SVG-to-JSX codegen camelCased every hyphenated attribute, turning
  `data-circle` into `dataCircle` (and `data-name` into `dataName`, etc.).
  React does not recognize camelCased data/aria props and logs a runtime
  warning ("React does not recognize the `dataCircle` prop on a DOM
  element"). The codegen now leaves `data-*` and `aria-*` attributes
  hyphenated so React accepts them as valid DOM attributes. Fixes the
  warning on icons such as `nextdotjs` (and 200+ other icons carrying
  `data-*` attributes).

- [#664](https://github.com/glincker/thesvg/pull/664) [`9cac540`](https://github.com/glincker/thesvg/commit/9cac5409f60e26dd295001bd6c0f6bc3cd6f7634) Thanks [@thegdsks](https://github.com/thegdsks)! - Correct the Zoho logo to the current official "Logolinism" mark

  The Zoho icon used an outdated single-color mark. Replaced it with the
  current official four-color logo (red, green, blue, yellow): `default`
  and `mono` now carry the interlocking-squares logomark, and new
  `wordmark` / `wordmarkDark` variants provide the full lockup with the
  Zoho wordmark for light and dark backgrounds.

## 3.1.1

### Patch Changes

- docs: fix brand name to theSVG, update icon counts to 6400+, retire VS Code live badge ([#648](https://github.com/glincker/thesvg/issues/648))

## 3.1.0

### Minor Changes

- [#647](https://github.com/glincker/thesvg/pull/647) [`af795b8`](https://github.com/glincker/thesvg/commit/af795b8ef2d5ef2e31d421e84e187ca7dbf94298) Thanks [@thegdsks](https://github.com/thegdsks)! - thesvg v3.1: 6,400+ icons, React package rendering fixes, and GLINR Studios

  New icon milestone: 6,409 brand icons across cloud-native, AI/ML, DevOps, security,
  and productivity tooling. React component rendering fixes for mono variants and
  per-path style fills. GLINR Studios announced as the new home of thesvg.

## 3.0.19

### Patch Changes

- feat: add variant prop support to React package ([#617](https://github.com/glincker/thesvg/issues/617))

## 3.0.18

### Patch Changes

- feat: bundle 7 community-requested icons + Wolt mono variant ([#605](https://github.com/glincker/thesvg/issues/605))

## 3.0.17

### Patch Changes

- feat: add 12 popular AI/dev brand icons ([#583](https://github.com/glincker/thesvg/issues/583))

## 3.0.16

### Patch Changes

- feat: onboard 7 community-submitted icons ([#582](https://github.com/glincker/thesvg/issues/582))

## 3.0.15

### Patch Changes

- feat: mobile-native app shell (Catalog 2026) ([#556](https://github.com/glincker/thesvg/issues/556))

## 3.0.14

### Patch Changes

- feat: add Friym icon ([#551](https://github.com/glincker/thesvg/issues/551))

## 3.0.13

### Patch Changes

- feat: add Masan Group icon ([#528](https://github.com/glincker/thesvg/issues/528))

## 3.0.12

### Patch Changes

- feat: Google 2026 landing, recents personalization, search analytics, and [#530](https://github.com/glincker/thesvg/issues/530) guard ([#531](https://github.com/glincker/thesvg/issues/531))

## 3.0.11

### Patch Changes

- chore: round-3 cleanup - icons.json indentation, wolt svg, icon counts ([#525](https://github.com/glincker/thesvg/issues/525))

## 3.0.10

### Patch Changes

- feat: add 4 brand icons (Apache Arrow, Await, OpenTUI, OWASP Dependency-Check) ([#438](https://github.com/glincker/thesvg/issues/438))

## 3.0.9

### Patch Changes

- feat: add Bao Viet Holdings icon ([#436](https://github.com/glincker/thesvg/issues/436))

## 3.0.8

### Patch Changes

- feat: add Lodgify icon ([#430](https://github.com/glincker/thesvg/issues/430))

## 3.0.7

### Patch Changes

- feat: add PNJ icon ([#416](https://github.com/glincker/thesvg/issues/416))

## 3.0.6

### Patch Changes

- feat: add Lume icon ([#413](https://github.com/glincker/thesvg/issues/413))

## 3.0.5

### Patch Changes

- feat: add Vietnam Airlines icon ([#374](https://github.com/glincker/thesvg/issues/374))

## 3.0.4

### Patch Changes

- feat: launch google 2026 icons, svg viewer, and category routes ([#401](https://github.com/glincker/thesvg/issues/401))

## 3.0.3

### Patch Changes

- feat: add pinecone icon ([#373](https://github.com/glincker/thesvg/issues/373))

## 3.0.2

### Patch Changes

- feat: add vinfast icon ([#366](https://github.com/glincker/thesvg/issues/366))

## 3.0.1

### Patch Changes

- feat: add vrs icon ([#360](https://github.com/glincker/thesvg/issues/360))

## 3.0.0

### Major Changes

- [#340](https://github.com/glincker/thesvg/pull/340) [`618af25`](https://github.com/glincker/thesvg/commit/618af253527342d2ea227f4eb0252c2eda183447) Thanks [@thegdsks](https://github.com/thegdsks)! - 3.0: catalog crosses six thousand icons.

  The 3.0 line marks the catalog passing 6,000 entries. No package-level API changes — every export, hook, and component continues to work without code edits. The major bump reflects the data-side milestone: a meaningful expansion of brand coverage across finance, gaming, consumer goods, entertainment, regional carriers, and dev tooling that contributors should know about before pinning.

## 2.1.12

### Patch Changes

- feat: add autodesk-inventor icon ([#209](https://github.com/glincker/thesvg/issues/209))

## 2.1.11

### Patch Changes

- feat: add wacheit icon from [#184](https://github.com/glincker/thesvg/issues/184) ([#189](https://github.com/glincker/thesvg/issues/189))

## 2.1.10

### Patch Changes

- feat: add genstory icon from [#160](https://github.com/glincker/thesvg/issues/160) ([#175](https://github.com/glincker/thesvg/issues/175))

## 2.1.9

### Patch Changes

- feat: add 3 brand icons from open requests (signalmelo, wisgate, unikoo) ([#171](https://github.com/glincker/thesvg/issues/171))

## 2.1.8

### Patch Changes

- ci: path-filter the build, add labeler + dependabot + auto-merge ([#139](https://github.com/glincker/thesvg/issues/139))

## 2.1.7

### Patch Changes

- Merge pull request [#130](https://github.com/glincker/thesvg/issues/130) from glincker/feat/icon-requests-batch

## 2.1.6

### Patch Changes

- fix: API docs + CLI registry call, add Selector Logo and myAccessi icons ([#115](https://github.com/glincker/thesvg/issues/115))

## 2.1.5

### Patch Changes

- fix: mark Roborock and FPT Play licenses as Proprietary ([#112](https://github.com/glincker/thesvg/issues/112))

## 2.1.4

### Patch Changes

- feat: add Pedi App icon ([#99](https://github.com/glincker/thesvg/issues/99))

## 2.1.3

### Patch Changes

- feat: add requested icons + fix Raycast extension ([#93](https://github.com/glincker/thesvg/issues/93))

## 2.1.2

### Patch Changes

- feat: add tsdown, UXUY, Timesheet, Kvant System, and Filagram icons ([#86](https://github.com/glincker/thesvg/issues/86))

## 2.1.1

### Patch Changes

- Merge pull request [#74](https://github.com/glincker/thesvg/issues/74) from glincker/fix/broken-svg-icons

## 2.1.0

### Minor Changes

- [`1f56737`](https://github.com/glincker/thesvg/commit/1f567372a3211f2fe7e49ee147299b8f8409b4a1) Thanks [@thegdsks](https://github.com/thegdsks)! - Add Kubernetes icon collection, Raycast integration, and community icons. Total: 5,645 icons.

## 2.0.1

### Patch Changes

- Merge pull request [#60](https://github.com/glincker/thesvg/issues/60) from glincker/feat/azure-gcp-collections-v2

## 2.0.0

### Major Changes

- [#52](https://github.com/glincker/thesvg/pull/52) [`108e9c3`](https://github.com/glincker/thesvg/commit/108e9c3dbe71899b423e4fdd54df47d12c49f2b8) Thanks [@thegdsks](https://github.com/thegdsks)! - v2.0.0 - AWS Architecture Icons, Amazon family brands, SEO improvements

  - Added 739 AWS architecture icons (services, resources, categories, groups)
  - Added Amazon family brand icons (Amazon, Prime, Kindle, Fire TV, Music, Whole Foods Market)
  - Total icon count now 4,758 with 10,000+ SVG variants
  - Enhanced sitemap with image URLs for Google Image indexing
  - Added JSON-LD structured data (WebPage, BreadcrumbList) for icon pages
  - Professional footer redesign with glassmorphism, animated counters, partner logos
  - New "collections" system (brands, aws) for icon organization

## 1.0.12

### Patch Changes

- Merge pull request [#48](https://github.com/glincker/thesvg/issues/48) from glincker/feat/add-amazon-family-icons

## 1.0.11

### Patch Changes

- Merge pull request [#47](https://github.com/glincker/thesvg/issues/47) from glincker/changeset-release/main

## 1.0.10

### Patch Changes

- Merge pull request [#46](https://github.com/glincker/thesvg/issues/46) from glincker/changeset-release/main]

## 1.0.9

### Patch Changes

- Merge pull request [#43](https://github.com/glincker/thesvg/issues/43) from glincker/changeset-release/main

## 1.0.8

### Patch Changes

- Merge pull request [#44](https://github.com/glincker/thesvg/issues/44) from glincker/feat/recently-added-icons

## 1.0.7

### Patch Changes

- feat: add dateAdded field and recently added icons section ([#42](https://github.com/glincker/thesvg/issues/42))

## 1.0.6

### Patch Changes

- fix: update org references from GLINCKER to glincker ([#33](https://github.com/glincker/thesvg/issues/33))

## 1.0.5

### Patch Changes

- feat: add British Council icon ([#30](https://github.com/GLINCKER/thesvg/issues/30))

## 1.0.4

### Patch Changes

- [`1b8f9bb`](https://github.com/glincker/thesvg/commit/1b8f9bba111edb86b74b5391a200fd6d6c29c500) Thanks [@thegdsks](https://github.com/thegdsks)! - Add AI assistant icons: profClaw (5 variants), PicoClaw, MimiClaw. Fix OpenClaw rendering bug (viewport-covering rectangle, invisible eyes).

## 1.0.3

### Patch Changes

- [`90be98a`](https://github.com/GLINCKER/thesvg/commit/90be98a4ff5fb66b4bc3345f0a7463994011b09a) Thanks [@github-actions[bot]](https://github.com/github-actions%5Bbot%5D)! - fix(react): emit createElement in ESM output instead of raw JSX ([#20](https://github.com/GLINCKER/thesvg/issues/20))

## 1.0.2

### Patch Changes

- [`2142e8f`](https://github.com/GLINCKER/thesvg/commit/2142e8f6ee00f435fd7a59b0bdcdbfb78ad9ab6f) Thanks [@thegdsks](https://github.com/thegdsks)! - Strip DOCTYPE declarations, inline style blocks, xml:space attributes, and dc/cc/rdf namespace artifacts from JSX output
