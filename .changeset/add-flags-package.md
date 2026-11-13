---
"@thesvg/flags": minor
"@thesvg/icons": patch
"@thesvg/react": patch
"@thesvg/vue": patch
"@thesvg/svelte": patch
"@thesvg/solid": patch
"@thesvg/preact": patch
"@thesvg/react-native": patch
"@thesvg/astro": patch
"@thesvg/static": patch
"@thesvg/cli": patch
"@thesvg/mcp-server": patch
---

Add the Flags category and the new `@thesvg/flags` package: every ISO 3166-1 country plus regional flags (England, Scotland, Wales, Catalonia, the Basque Country, Galicia, the Valencian Community, the Balearic Islands, the Canary Islands, Corsica, Occitania, the EU and the UN), each in 4x3, square and circle, with per-flag React components, plain SVG modules, color palettes, search aliases and `getFlagForLocale`.

Flags are in the shared catalog (website, search, CLI, MCP, CDN) but are not bundled into `@thesvg/icons` or the framework packages. This is not a breaking change: flags were never shipped in those packages before, so their contents are unchanged. Their generators now read the catalog through one shared exclusion list. The CLI and MCP server point flag results at `@thesvg/flags`, and the MCP search lists exact code, number and emoji matches first and returns flag palettes.
