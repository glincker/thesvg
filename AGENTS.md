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

## UI Icon Rules

UI icons are a separate section from brand icons (`/ui`, `@thesvg/ui*`). They share the site shell, never their code or data.

### Where things live
- Source of truth: `src/data/ui/sets/<set-id>.json`, one file per release set, one line per icon (slug, tags, geometry).
- Generated, never edit by hand: `src/data/ui-icons.json`, `src/data/ui/looks/*.json`, `src/lib/ui-icons/sets.generated.ts`. Run `pnpm ui:build` after changing a set file and commit the result. `pnpm ui:check` fails when they are stale.
- `public/ui/**` are build artifacts and are not committed.
- UI code lives in `src/lib/ui-icons`, `src/components/ui-icons` and `src/app/ui`. Brand code never imports from there.

### Review checklist
- A new icon has a kebab-case slug, at least two tags (four for full marks), geometry inside the 1 to 23 live area and a real category (not `General`).
- Every icon scores at least the build's quality minimum (`UI_QUALITY_MIN_SCORE`, default 70). Thresholds come from the environment, never from literals in the code that uses them.
- UI code does not import brand code (`@/lib/icons`, `@/components/icons/*` and so on) except the shared pieces allowed in `eslint.config.mjs`, and brand code does not import UI code except the files in `BRAND_TO_UI_ALLOWED`. The linter enforces both directions. Do not widen an allow list to silence an error.
- Brand icons and UI icons are tested separately: `pnpm test:brand` and `pnpm test:ui`. A change to one side should not need the other side's tests.
- Package builds for `@thesvg/ui-*` go through `scripts/ui/package-builder.mjs`. Do not copy a generator into a package.

## Code Quality Rules

### TypeScript
- No `any` types
- Strict mode enabled
- Server Components by default, `"use client"` only when needed

### Styling
- Tailwind CSS only, no inline styles or CSS modules, except a narrow
  exception for CSS custom properties carrying a genuinely per-instance
  runtime value (e.g. a color derived from an icon's own hex) that cannot
  be expressed as a static utility class
- shadcn/ui components, extend don't reinvent
- Icons in site chrome are our own UI icons: `<UiGlyph name="arrow-right" />`
  from `@/components/ui-glyph`. Do not add Lucide or Phosphor imports. Files
  already converted are locked by ESLint (`OWN_ICONS_ONLY` in
  `eslint.config.mjs`); older files still on those libraries move over in their
  own PRs. If an icon you need is missing, add it to a set file instead of
  reaching for a library.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
