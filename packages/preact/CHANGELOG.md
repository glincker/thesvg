# @thesvg/preact

## 4.0.8

### Patch Changes

- [#1543](https://github.com/glincker/thesvg/pull/1543) [`7cb4ede`](https://github.com/glincker/thesvg/commit/7cb4edeae1fbc56cee103998c35e54458669f296) Thanks [@thegdsks](https://github.com/thegdsks)! - Add the Flags category and the new `@thesvg/flags` package: every ISO 3166-1 country plus regional flags (England, Scotland, Wales, Catalonia, the Basque Country, Galicia, the Valencian Community, the Balearic Islands, the Canary Islands, Corsica, Occitania, the EU and the UN), each in 4x3, square and circle, with per-flag React components, plain SVG modules, color palettes, search aliases and `getFlagForLocale`.
  
  Flags are in the shared catalog (website, search, CLI, MCP, CDN) but are not bundled into `@thesvg/icons` or the framework packages. This is not a breaking change: flags were never shipped in those packages before, so their contents are unchanged. Their generators now read the catalog through one shared exclusion list. The CLI and MCP server point flag results at `@thesvg/flags`, and the MCP search lists exact code, number and emoji matches first and returns flag palettes.

## 4.0.7

### Patch Changes

- fix: update deepgram brand color to E042FF ([#1541](https://github.com/glincker/thesvg/issues/1541))

## 4.0.6

### Patch Changes

- feat: add icons for projects that use thesvg ([#1535](https://github.com/glincker/thesvg/issues/1535))

## 4.0.5

### Patch Changes

- feat: add gong symbol variant ([#1531](https://github.com/glincker/thesvg/issues/1531))

## 4.0.4

### Patch Changes

- feat: add lumin icon ([#1493](https://github.com/glincker/thesvg/issues/1493))

## 4.0.3

### Patch Changes

- feat: add 27 self-hosted app icons ([#1483](https://github.com/glincker/thesvg/issues/1483))

## 4.0.1

### Patch Changes

- feat: add Astro, Solid, Preact, plain JS and static packages ([#1430](https://github.com/glincker/thesvg/issues/1430))
