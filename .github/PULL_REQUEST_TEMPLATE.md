## Description

<!-- What does this PR do? -->

## Type

- [ ] New icon(s)
- [ ] Icon update/fix
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Maintenance/chore
- [ ] UI icon(s)

## Checklist

- [ ] My changes follow the project's conventions
- [ ] I've tested the build: `cd packages/icons && npm run build`
- [ ] Security audit passes: `npm run audit`
- [ ] Dist validation passes: `npm run validate`

### For icon submissions:

- [ ] SVG has a valid `viewBox` attribute
- [ ] SVG is under 50KB
- [ ] No embedded `<script>` tags or event handlers
- [ ] Icon accurately represents the official brand
- [ ] `icons.json` entry is complete (slug, title, hex, categories, variants)

### For UI icon changes (`src/data/ui/**`):

- [ ] I drew the icon myself, it is not traced or adapted from another icon set
- [ ] I ran `pnpm ui:build` and committed everything it changed
- [ ] `pnpm test:ui` passes and every icon scores at least the quality minimum
- [ ] The slug is kebab-case and unique, with at least two tags (four for full marks) and a real category
- [ ] I did not edit generated files (`src/data/ui-icons.json`, `src/data/ui/looks/**`, `src/lib/ui-icons/sets.generated.ts`) by hand

## Related Issues

<!-- Closes #123 -->
