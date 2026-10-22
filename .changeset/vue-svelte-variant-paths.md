---
"@thesvg/vue": patch
"@thesvg/svelte": patch
---

Render google-workspace instead of an empty placeholder

The builders rebuilt each SVG's file name from its variant key, so an
icon whose file lives elsewhere (google-workspace's 2026 mark is in
/icons/google-workspace-2026/) shipped as a component that renders
nothing. SVGs are now read from their icons.json path, like
@thesvg/react.
