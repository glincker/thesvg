# thesvg - AI Review Guidelines

## SVG Icon Submission Rules

### Required
- Every icon directory must have `default.svg`
- Every SVG must have a valid `viewBox` attribute
- Every SVG must contain a `<title>` element with the brand name
- Preferred viewBox: `0 0 24 24` (match library convention)
- File size must be under 50KB
- No `<script>` tags, event handlers, or `javascript:` URIs
- No embedded raster images (`<image>` with base64 data)
- No `<?xml>` declarations or `<!DOCTYPE>` preambles

### Fill and Color Rules
- `default.svg`: Must use the brand hex color as `fill` on `<svg>` root (not `currentColor`)
- `mono.svg`: Must use `fill="currentColor"` on `<svg>` root
- `light.svg`: Must use `fill="#ffffff"` or similar light color
- `dark.svg`: Must use `fill="#1a1a2e"` or similar dark color
- Detail elements (eyes, pupils, accents) that contrast with the body must have explicit `fill` overrides - they must not inherit the root fill if that makes them invisible
- Stroke colors on antennae, lines, or accents must contrast with adjacent filled shapes - same-color strokes over same-color fills are invisible
- Never include a viewport-covering rectangle like `<path d="M0 0h24v24H0z"/>` without `fill="none"` - this covers the entire icon

### icons.json Registry
- Located at `src/data/icons.json`
- Entries must be alphabetically sorted by `slug`
- Required fields: `slug`, `title`, `aliases`, `hex`, `categories`, `variants`, `license`, `url`
- `hex` must not include `#` prefix (e.g. `"f43f5e"` not `"#f43f5e"`)
- `variants` object keys must match filenames in `public/icons/{slug}/`
- `categories` must use existing category names (check existing entries)

### Variant File Naming
```
public/icons/{slug}/
  default.svg          # Required - brand color
  mono.svg             # Recommended - inherits text color
  light.svg            # Optional - for dark backgrounds
  dark.svg             # Optional - for light backgrounds
  color.svg            # Optional - multi-color/gradient version
  wordmark.svg         # Optional - text logo
  wordmarkLight.svg    # Optional - light text logo
  wordmarkDark.svg     # Optional - dark text logo
```

### Slug Naming Convention
- Lowercase, hyphen-separated
- No uppercase, no spaces, no underscores
- Must match the directory name under `public/icons/`

## Code Quality Rules

### TypeScript
- No `any` types
- Strict mode enabled
- Server Components by default, `"use client"` only when needed

### Styling
- Tailwind CSS only, no inline styles or CSS modules
- shadcn/ui components, extend don't reinvent
- Lucide icons for UI chrome (not for brand icons)

### Git
- Never commit directly to `main`
- Conventional commit messages: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `perf:`
- No AI tool mentions in commit messages

## Common Review Pitfalls

1. **Invisible elements**: Fill color matches background or parent fill - always verify contrast
2. **Bounding box paths**: `M0 0hWvH` rectangles that cover the entire icon
3. **Wrong alphabetical position**: icons.json must stay sorted by slug
4. **Missing fill overrides**: Child elements inheriting root fill when they need a different color
5. **Inconsistent viewBox**: All icons in a PR should use the same coordinate space as the library standard
6. **Google Fonts in SVG**: External `@import url()` for fonts will not render in most contexts
