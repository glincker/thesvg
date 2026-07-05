---
"thesvg": patch
"@thesvg/react": patch
---

Quality pass: lint hygiene, search fixes, and a correct React validator

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
