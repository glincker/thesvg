# Contributing to theSVG

Thank you for your interest in contributing to theSVG! This guide will help you
get started.

## Ways to Contribute

### Submit a New Icon

You have two options:

**A. Via the submit form** (easiest):

1. Go to [thesvg.org/submit](https://thesvg.org/submit)
2. Upload the SVG, fill in the brand name, category, and website URL
3. Submit — this opens a triaged issue

**B. Via a direct PR** (faster if you're comfortable with git):

1. Fork the repo and branch off `main`: `git checkout -b feat/icon-{slug}`
2. Drop the SVG at `public/icons/{slug}/default.svg`
3. Add an entry to `src/data/icons.json` at the correct alphabetical position, following the schema:
   ```json
   {
     "slug": "your-brand",
     "title": "Your Brand",
     "aliases": [],
     "hex": "F97316",
     "categories": ["DevTool"],
     "variants": { "default": "/icons/your-brand/default.svg" },
     "license": "CC0-1.0",
     "url": "https://yourbrand.com",
     "collection": "brands",
     "dateAdded": "2026-05-16"
   }
   ```
4. Open a PR titled `feat: add {slug} icon`. The triage workflow will auto-label it; if everything passes (`Validate SVG`, `Lint & Build`), it'll auto-merge.

**Requirements for icon submissions (both paths):**

- SVG format only (no PNG, JPG, etc.)
- Must be an official brand logo or icon
- Must have a valid `viewBox` attribute
- File size under 50KB
- No embedded `<script>` tags, event handlers, or `javascript:` URIs
- No raster images embedded in the SVG
- Brand domain at least 30 days old (we reject fresh-spun-up sites)
- One valid category from the [issue template's dropdown](.github/ISSUE_TEMPLATE/icon_request.yml)
- Preferably optimized with [SVGO](https://github.com/svg/svgo)

### Report an Issue

- **Incorrect icon data** - wrong brand name, color, category, or URL
- **Missing variants** - brand has a dark/light/mono version we don't have
- **Broken icon** - SVG doesn't render correctly
- **Package bug** - import errors, TypeScript issues, build problems

Use the appropriate [issue template](https://github.com/glincker/thesvg/issues/new/choose).

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
git clone https://github.com/glincker/thesvg.git
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

## Collections

theSVG organizes icons into collections. Each icon belongs to exactly one collection:

| Collection | Slug prefix | Source | License |
|------------|------------|--------|---------|
| Brand Icons | *(none)* | Community submissions | Per-brand |
| AWS Architecture | `aws-` | Official AWS icon package | [CC BY-ND 2.0](https://creativecommons.org/licenses/by-nd/2.0/) |
| GCP *(planned)* | `gcp-` | Google Cloud icons | TBD |
| Azure *(planned)* | `azure-` | Microsoft Azure icons | TBD |

### Submitting brand icons

Use [thesvg.org/submit](https://thesvg.org/submit) or open a PR. Brand icons go in `public/icons/{slug}/` and get `"collection": "brands"` in icons.json.

### Architecture icon collections (AWS, GCP, Azure)

Architecture icons are imported in bulk from official icon packages using scripts in `scripts/`. These icons are **not modified** -- all SVG files (including size variants like 16/32/64px) are provided by the official package and copied verbatim to comply with their respective licenses. Do not submit individual architecture icons through the submit form.

To update an architecture collection (e.g., when AWS releases a new quarterly icon set):

1. Download the latest official icon package
2. Run the import script: `npx tsx scripts/import-aws-icons.ts`
3. Verify the import: check `src/data/icons.json` and `public/icons/aws-*/`
4. Open a PR with the updated icons

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
  "url": "https://github.com",
  "collection": "brands",
  "dateAdded": "2026-03-07"
}
```

For architecture icons, additional fields:

```json
{
  "slug": "aws-amazon-s3",
  "title": "Amazon S3",
  "collection": "aws",
  "collectionVersion": "2026-Q1",
  "collectionMeta": {
    "type": "service",
    "parent": "Storage"
  }
}
```

SVG files live in `public/icons/{slug}/{variant}.svg`.

### Version lineage (rebrands and legacy marks)

When a brand replaces its logo (Microsoft 2012 to 2026, Twitter to X, Slack 2019, etc.) we keep the previous mark in the catalog as a separate slug instead of overwriting history. Two optional fields document the relationship:

- `supersedes` on the current entry, pointing to the older slug
- `supersededBy` on the older entry, pointing to the current slug

Both sides MUST agree. The validator script `tools/validate-lineage.mjs` (run automatically in CI) fails the build if a `supersedes` link is not mirrored by a `supersededBy` link on the other entry.

```jsonc
// new canonical entry
{
  "slug": "thesvg",
  "title": "theSVG",
  "supersedes": "thesvg-legacy"
}
// archived predecessor entry
{
  "slug": "thesvg-legacy",
  "title": "theSVG (legacy)",
  "supersededBy": "thesvg"
}
```

When you ship a rebrand:

1. Move the existing entry to a new slug `{slug}-legacy` (or `{slug}-{year}-q{n}` for a more specific archive label) and copy its SVG files to `public/icons/{slug}-legacy/`.
2. Add the new mark under the original `{slug}` slug.
3. Set `supersedes` on the new entry and `supersededBy` on the legacy entry.
4. `dateAdded`: the legacy entry keeps its original date; the new entry takes the rebrand date.

The icon detail page renders a cross-link card between the two automatically, so a user landing on the legacy version sees "Current version" and vice versa.

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

AWS Architecture Icons are distributed unmodified under [CC BY-ND 2.0](https://creativecommons.org/licenses/by-nd/2.0/). Amazon
Web Services and all related marks are trademarks of Amazon.com, Inc.

For trademark concerns, see [TRADEMARK.md](./TRADEMARK.md) or contact
[support@glincker.com](mailto:support@glincker.com).

## Become a Moderator

thesvg runs on triage: labeling issues, checking SVG submissions against the
requirements above, and reviewing incoming PRs. If you've been doing that
informally, we'd like to make it official.

**What moderators get**: triage access to the repo, so you can label issues,
close/reopen, and request changes on PRs. Moderators do not get merge or push
access; merges still go through a maintainer review.

**What we look for**:

- At least one merged icon or code contribution, or a track record of helpful
  triage on issues/discussions
- Familiarity with the [icon submission requirements](#submit-a-new-icon) so
  you can sanity-check incoming requests (SVG validity, size, domain age,
  category)
- Enough time to check in on new issues/PRs at least weekly

**How to apply**: open a
[Moderator Application](https://github.com/glincker/thesvg/issues/new?template=moderator_application.yml)
issue with links to your prior contributions. We review applications as they
come in and follow up in the issue.

## Questions?

- [Open a discussion](https://github.com/glincker/thesvg/discussions)
- [Browse existing issues](https://github.com/glincker/thesvg/issues)
- [Contact us](https://thesvg.org/contact)
