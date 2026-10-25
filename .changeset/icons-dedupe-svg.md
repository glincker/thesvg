---
"@thesvg/icons": patch
---

Cut the unpacked package size by about 30%

Each icon module wrote its main SVG twice, once as `svg` and once inside
`variants`. It is now written once and both exports refer to it. Export
names, values, order and types are unchanged.
