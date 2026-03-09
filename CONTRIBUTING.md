# Contributing to theSVG

Thank you for your interest in contributing to theSVG! This guide will help you
get started.

## Ways to Contribute

### Submit a New Icon

The easiest way to contribute is to submit a new brand icon:

1. Go to [thesvg.org/submit](https://thesvg.org/submit)
2. Upload the SVG file
3. Fill in the brand name, category, and website URL
4. Submit for review

**Requirements for icon submissions:**

- SVG format only (no PNG, JPG, etc.)
- Must be an official brand logo or icon
- Must have a valid `viewBox` attribute
- File size under 50KB
- No embedded `<script>` tags, event handlers, or `javascript:` URIs
- No raster images embedded in the SVG
- Preferably optimized with [SVGO](https://github.com/svg/svgo)

### Report an Issue

- **Incorrect icon data** - wrong brand name, color, category, or URL
- **Missing variants** - brand has a dark/light/mono version we don't have
- **Broken icon** - SVG doesn't render correctly
- **Package bug** - import errors, TypeScript issues, build problems

Use the appropriate [issue template](https://github.com/GLINCKER/thesvg/issues/new/choose).

### Improve the Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run the build: `cd packages/icons && npm run build`
5. Run audits: `npm run audit && npm run validate`
6. Commit with conventional commits: `feat: add new feature`
7. Open a pull request

## Development Setup

```bash
# Clone the repo
git clone https://github.com/GLINCKER/thesvg.git
cd thesvg

# Install dependencies
pnpm install

# Run the website
pnpm dev

# Build the icon package
cd packages/icons
npm run build
npm run audit
npm run validate
```

## Commit Convention

We use [conventional commits](https://www.conventionalcommits.org/):

- `feat: add new feature` - triggers a minor release
- `fix: fix a bug` - triggers a patch release
- `feat!: breaking change` - triggers a major release
- `docs: update readme` - no release
- `chore: maintenance` - no release

## Icon Data Structure

Icons are stored in `src/data/icons.json`. Each entry:

```json
{
  "slug": "github",
  "title": "GitHub",
  "aliases": ["gh"],
  "hex": "181717",
  "categories": ["DevTool", "VCS"],
  "variants": {
    "default": "/icons/github/default.svg",
    "mono": "/icons/github/mono.svg"
  },
  "license": "MIT",
  "url": "https://github.com"
}
```

SVG files live in `public/icons/{slug}/{variant}.svg`.

## Brand Icon Guidelines

- We only include official brand assets - no fan-made or modified logos
- Icons should represent the brand accurately as it appears in official materials
- Do not modify brand colors unless providing a mono variant
- Check the brand's public guidelines or press kit before submitting
- If a brand has explicit restrictions on third-party use, note it in the PR

### Brands that restrict distribution

Some companies actively enforce trademark restrictions on third-party icon
distribution. Before submitting, check whether the brand allows it. If you are
unsure, submit anyway and we will review.

If a brand owner requests removal, we comply within 24 hours. See our
[Trademark Policy](./TRADEMARK.md) for details.

## Legal

By contributing, you agree that your contributions will be licensed under the
project's [MIT License](./LICENSE).

All brand icons remain the property of their respective owners. Icons are
provided for identification and development purposes only, consistent with
nominative fair use of trademarks. thesvg is not affiliated with, endorsed by,
or sponsored by any of the brands whose icons appear in our library.

For trademark concerns, see [TRADEMARK.md](./TRADEMARK.md) or contact
[support@glincker.com](mailto:support@glincker.com).

## Questions?

- [Open a discussion](https://github.com/GLINCKER/thesvg/discussions)
- [Browse existing issues](https://github.com/GLINCKER/thesvg/issues)
- [Contact us](https://thesvg.org/contact)
