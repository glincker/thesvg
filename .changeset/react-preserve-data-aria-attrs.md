---
"@thesvg/react": patch
---

Preserve data-* and aria-* attributes in generated React components

The SVG-to-JSX codegen camelCased every hyphenated attribute, turning
`data-circle` into `dataCircle` (and `data-name` into `dataName`, etc.).
React does not recognize camelCased data/aria props and logs a runtime
warning ("React does not recognize the `dataCircle` prop on a DOM
element"). The codegen now leaves `data-*` and `aria-*` attributes
hyphenated so React accepts them as valid DOM attributes. Fixes the
warning on icons such as `nextdotjs` (and 200+ other icons carrying
`data-*` attributes).
