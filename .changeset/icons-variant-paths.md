---
"@thesvg/icons": patch
---

Ship every variant listed in icons.json

The build rebuilt each variant's file name from its key
(`wordmarkLight` -> `wordmarkLight.svg`), but many files are named
differently (`wordmark-light.svg`, or `default` pointing at
`color.svg`). 253 variants were silently missing, for example
`anthropic` had no light or dark wordmark and `antgroup` had no
`default`. `google-workspace` was not published at all. Variants are now
read from their icons.json path.
