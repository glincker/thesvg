# thesvg

## 3.2.11

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.2.11

## 3.2.10

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.2.10

## 3.2.9

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.2.9

## 3.2.8

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.2.8

## 3.2.6

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.2.6

## 3.2.5

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.2.5

## 3.2.4

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.2.4

## 3.2.3

### Patch Changes

- [#674](https://github.com/glincker/thesvg/pull/674) [`2dcbad6`](https://github.com/glincker/thesvg/commit/2dcbad61c750ba79a7f2f5f2e054cf72b171a0b9) Thanks [@thegdsks](https://github.com/thegdsks)! - Consolidate and XSS-harden JSON-LD structured data

  All seven pages that emit JSON-LD now use a single `JsonLd` server component
  that escapes `<` to `<`, so a brand name or description can never break
  out of the `<script>` tag. This dedups seven copies of the inline script and
  closes a latent injection gap. (Note: this does not change where the JSON-LD is
  delivered; see PR notes.)

- [#672](https://github.com/glincker/thesvg/pull/672) [`bf3a13f`](https://github.com/glincker/thesvg/commit/bf3a13f012c8fcaf8e71890bc22707bfef337f87) Thanks [@thegdsks](https://github.com/thegdsks)! - Enrich per-icon structured data for richer search results

  The icon detail page's ImageObject JSON-LD now marks the icon as free
  (`isAccessibleForFree`, `representativeOfPage`) and exposes each additional
  variant (mono, dark, color, wordmark, ...) as its own `associatedMedia`
  ImageObject, so search engines can surface a brand's variants individually.

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

- [#669](https://github.com/glincker/thesvg/pull/669) [`4dd70cc`](https://github.com/glincker/thesvg/commit/4dd70ccff3788a320870e01827d30da57cdc433b) Thanks [@thegdsks](https://github.com/thegdsks)! - Make the whole sidebar scrollable with collapsible Collections/Featured

  Previously only the Categories list scrolled, so on short viewports the nav,
  Collections, and Featured sections above it could become unreachable. The
  primary nav stays pinned at the top; Collections, Featured, and Categories now
  share one scroll region. Collections and Featured are collapsible to reclaim
  space. Also refreshed the OpenSearch descriptor (icon count + a 32px image) so
  browser address-bar search stays accurate.

## 3.2.1

### Patch Changes

- [#667](https://github.com/glincker/thesvg/pull/667) [`f324ff6`](https://github.com/glincker/thesvg/commit/f324ff6299feeeb03b638c73e6e33d79f5ebe5cd) Thanks [@thegdsks](https://github.com/thegdsks)! - Fix announcement bar overlap and prioritize brand categories in the sidebar

  - The top announcement bar no longer overlaps the header and sidebar. The bar
    publishes its height as a `--banner-h` CSS variable, and the sticky header and
    fixed sidebar offset by it, so they always sit below the bar (and revert
    cleanly when it is dismissed). Also polished the bar styling (pulse dot,
    subtle orange gradient, clearer link and dismiss affordance).
  - The sidebar Categories list now counts brand and community icons only, so
    cloud architecture taxonomy (Compute, Integration, Kubernetes, General, ...)
    no longer buries brand categories. Architecture categories still appear when
    the AWS/Azure/GCP/Kubernetes collection is selected.

## 3.2.0

### Minor Changes

- [#661](https://github.com/glincker/thesvg/pull/661) [`3609a5f`](https://github.com/glincker/thesvg/commit/3609a5f05f2592e0e4e3c15fe1429fa0e2e73de4) Thanks [@thegdsks](https://github.com/thegdsks)! - Onboard Affinity, Outlook Calendar, and Samsung Browser icons; fix Audible source URL

  Adds three community-requested brand icons (Affinity, Outlook Calendar, Samsung Browser)
  with normalized slugs, corrected brand hex values, and valid categories. Also corrects
  the Audible entry URL to the official brand site.

### Patch Changes

- [#665](https://github.com/glincker/thesvg/pull/665) [`737165d`](https://github.com/glincker/thesvg/commit/737165dd7b3739cf684a1b53b09ef5ba83435509) Thanks [@thegdsks](https://github.com/thegdsks)! - Fix conditional hook call in IconPageClient

  `useMemo` was called after an early `return null`, which violates the
  rules of hooks and could throw when an icon slug has no match. Hooks now
  run before the early return, with null-guarded memo bodies.

- [#663](https://github.com/glincker/thesvg/pull/663) [`a396b82`](https://github.com/glincker/thesvg/commit/a396b8211722e75f61f87212fc9d8f9b2c7a0eb5) Thanks [@thegdsks](https://github.com/thegdsks)! - Make the sidebar category list scroll independently

  The sidebar is a fixed-height flex column, but the categories ScrollArea
  had `flex-1` without `min-h-0`, so it could not shrink below its content
  height and the list overflowed the sidebar instead of scrolling. Adding
  `min-h-0` lets the ScrollArea shrink within the column so the long
  category list scrolls on its own while the top navigation stays in place.

- [#664](https://github.com/glincker/thesvg/pull/664) [`9cac540`](https://github.com/glincker/thesvg/commit/9cac5409f60e26dd295001bd6c0f6bc3cd6f7634) Thanks [@thegdsks](https://github.com/thegdsks)! - Correct the Zoho logo to the current official "Logolinism" mark

  The Zoho icon used an outdated single-color mark. Replaced it with the
  current official four-color logo (red, green, blue, yellow): `default`
  and `mono` now carry the interlocking-squares logomark, and new
  `wordmark` / `wordmarkDark` variants provide the full lockup with the
  Zoho wordmark for light and dark backgrounds.

- Updated dependencies [[`3609a5f`](https://github.com/glincker/thesvg/commit/3609a5f05f2592e0e4e3c15fe1429fa0e2e73de4), [`9cac540`](https://github.com/glincker/thesvg/commit/9cac5409f60e26dd295001bd6c0f6bc3cd6f7634)]:
  - @thesvg/icons@3.2.0

## 3.1.1

### Patch Changes

- docs: fix brand name to theSVG, update icon counts to 6400+, retire VS Code live badge ([#648](https://github.com/glincker/thesvg/issues/648))

- Updated dependencies []:
  - @thesvg/icons@3.1.1

## 3.1.0

### Minor Changes

- [#647](https://github.com/glincker/thesvg/pull/647) [`af795b8`](https://github.com/glincker/thesvg/commit/af795b8ef2d5ef2e31d421e84e187ca7dbf94298) Thanks [@thegdsks](https://github.com/thegdsks)! - thesvg v3.1: 6,400+ icons, React package rendering fixes, and GLINR Studios

  New icon milestone: 6,409 brand icons across cloud-native, AI/ML, DevOps, security,
  and productivity tooling. React component rendering fixes for mono variants and
  per-path style fills. GLINR Studios announced as the new home of thesvg.

### Patch Changes

- Updated dependencies [[`af795b8`](https://github.com/glincker/thesvg/commit/af795b8ef2d5ef2e31d421e84e187ca7dbf94298)]:
  - @thesvg/icons@3.1.0

## 3.0.18

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.18

## 3.0.17

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.17

## 3.0.16

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.16

## 3.0.15

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.15

## 3.0.14

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.14

## 3.0.13

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.13

## 3.0.12

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.12

## 3.0.11

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.11

## 3.0.10

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.10

## 3.0.9

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.9

## 3.0.8

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.8

## 3.0.7

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.7

## 3.0.6

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.6

## 3.0.5

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.5

## 3.0.4

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.4

## 3.0.3

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.3

## 3.0.2

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.2

## 3.0.1

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@3.0.1

## 3.0.0

### Major Changes

- [#340](https://github.com/glincker/thesvg/pull/340) [`618af25`](https://github.com/glincker/thesvg/commit/618af253527342d2ea227f4eb0252c2eda183447) Thanks [@thegdsks](https://github.com/thegdsks)! - 3.0: catalog crosses six thousand icons.

  The 3.0 line marks the catalog passing 6,000 entries. No package-level API changes — every export, hook, and component continues to work without code edits. The major bump reflects the data-side milestone: a meaningful expansion of brand coverage across finance, gaming, consumer goods, entertainment, regional carriers, and dev tooling that contributors should know about before pinning.

### Patch Changes

- Updated dependencies [[`618af25`](https://github.com/glincker/thesvg/commit/618af253527342d2ea227f4eb0252c2eda183447)]:
  - @thesvg/icons@3.0.0

## 2.1.12

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.12

## 2.1.11

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.11

## 2.1.10

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.10

## 2.1.9

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.9

## 2.1.8

### Patch Changes

- ci: path-filter the build, add labeler + dependabot + auto-merge ([#139](https://github.com/glincker/thesvg/issues/139))

## 2.1.7

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.7

## 2.1.6

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.6

## 2.1.5

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.5

## 2.1.4

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.4

## 2.1.3

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.3

## 2.1.2

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.2

## 2.1.1

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.1.1

## 2.1.0

### Minor Changes

- [`1f56737`](https://github.com/glincker/thesvg/commit/1f567372a3211f2fe7e49ee147299b8f8409b4a1) Thanks [@thegdsks](https://github.com/thegdsks)! - Add Kubernetes icon collection, Raycast integration, and community icons. Total: 5,645 icons.

### Patch Changes

- Updated dependencies [[`1f56737`](https://github.com/glincker/thesvg/commit/1f567372a3211f2fe7e49ee147299b8f8409b4a1)]:
  - @thesvg/icons@2.1.0

## 2.0.1

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@2.0.1

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

### Patch Changes

- Updated dependencies [[`108e9c3`](https://github.com/glincker/thesvg/commit/108e9c3dbe71899b423e4fdd54df47d12c49f2b8)]:
  - @thesvg/icons@2.0.0

## 1.0.12

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@1.0.12

## 1.0.11

### Patch Changes

- Merge pull request [#47](https://github.com/glincker/thesvg/issues/47) from glincker/changeset-release/main

- Updated dependencies []:
  - @thesvg/icons@1.0.11

## 1.0.10

### Patch Changes

- Merge pull request [#46](https://github.com/glincker/thesvg/issues/46) from glincker/changeset-release/main]

- Updated dependencies []:
  - @thesvg/icons@1.0.10

## 1.0.9

### Patch Changes

- Merge pull request [#43](https://github.com/glincker/thesvg/issues/43) from glincker/changeset-release/main

- Updated dependencies []:
  - @thesvg/icons@1.0.9

## 1.0.8

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@1.0.8

## 1.0.7

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@1.0.7

## 1.0.6

### Patch Changes

- fix: update org references from GLINCKER to glincker ([#33](https://github.com/glincker/thesvg/issues/33))

- Updated dependencies []:
  - @thesvg/icons@1.0.6

## 1.0.5

### Patch Changes

- feat: add British Council icon ([#30](https://github.com/GLINCKER/thesvg/issues/30))

- Updated dependencies []:
  - @thesvg/icons@1.0.5

## 1.0.4

### Patch Changes

- [`1b8f9bb`](https://github.com/glincker/thesvg/commit/1b8f9bba111edb86b74b5391a200fd6d6c29c500) Thanks [@thegdsks](https://github.com/thegdsks)! - Add AI assistant icons: profClaw (5 variants), PicoClaw, MimiClaw. Fix OpenClaw rendering bug (viewport-covering rectangle, invisible eyes).

- Updated dependencies [[`1b8f9bb`](https://github.com/glincker/thesvg/commit/1b8f9bba111edb86b74b5391a200fd6d6c29c500)]:
  - @thesvg/icons@1.0.4

## 1.0.2

### Patch Changes

- Updated dependencies []:
  - @thesvg/icons@1.0.2
