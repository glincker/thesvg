---
"@thesvg/react": patch
---

Fix two rendering bugs in the React package generator:

1. **Mono variants invisible by default** -- icons using the `mono` variant (e.g. Apple, Facebook mono) rendered as invisible because the generator set `fill="none"` on the root SVG when no explicit fill attribute was present. Mono variants now default to `fill="currentColor"` so they inherit the surrounding text color without requiring the caller to pass `fill` manually.

2. **Per-path `style` fills silently dropped** -- icons whose SVG paths use `style="fill:#hex;..."` (e.g. Facebook default, whose blue circle and white "f" are declared via style attributes) lost all per-path fills in the generated component. The cause was a double-conversion: `svgToJsxInner` pre-converted style strings to JSX object format (`style={{ ... }}`), but `convertJsxToCjs` uses a quoted-value regex that cannot parse JSX object format -- so styles were silently discarded. Style attributes are now passed through as CSS strings to `convertJsxToCjs`, which correctly converts them to React style objects.
