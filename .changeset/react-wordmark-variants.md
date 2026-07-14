---
"@thesvg/react": patch
---

Include wordmarkMono, wordmarkLight, and wordmarkDark variants in generated React components

The codegen reconstructed each variant's SVG filename from its camelCase
key (`wordmarkLight` -> `wordmarkLight.svg`), but those files are stored
kebab-case on disk (`wordmark-light.svg`), so the variant silently failed
to load and was dropped from the component's variant union entirely.
icons.json already records the correct path for every variant; the codegen
now reads that path directly instead of reconstructing it. Fixes 221
missing variants across 70+ icons, including Apple Music, Zoom, TikTok,
Vercel, and YouTube. Fixes #740.
