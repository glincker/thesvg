# Install and packages

All the ways to install theSVG and the full package list.

Back to the [README](../README.md).

## Install

**npm**

```bash
npm install thesvg
```

**Homebrew**

```bash
brew tap glincker/thesvg
brew install thesvg
```

```ts
import github from "thesvg/github";

github.svg;        // raw SVG string
github.title;      // "GitHub"
github.hex;        // "181717"
github.variants;   // { default: "<svg...>", mono: "<svg...>" }
```

Or use the scoped package for tree-shaking:

```bash
npm install @thesvg/icons
```

## Packages

| Package | Description | |
|---------|-------------|---|
| [`thesvg`](https://www.npmjs.com/package/thesvg) | All icons in one package | [![npm](https://img.shields.io/npm/v/thesvg?style=flat-square&color=C2410C)](https://www.npmjs.com/package/thesvg) |
| [`@thesvg/icons`](https://www.npmjs.com/package/@thesvg/icons) | Core icon data, tree-shakeable | [![npm](https://img.shields.io/npm/v/@thesvg/icons?style=flat-square&color=C2410C)](https://www.npmjs.com/package/@thesvg/icons) |
| [`@thesvg/react`](https://www.npmjs.com/package/@thesvg/react) | Typed React components | [![npm](https://img.shields.io/npm/v/@thesvg/react?style=flat-square&color=C2410C)](https://www.npmjs.com/package/@thesvg/react) |
| [`@thesvg/vue`](https://www.npmjs.com/package/@thesvg/vue) | Typed Vue 3 components | [![npm](https://img.shields.io/npm/v/@thesvg/vue?style=flat-square&color=C2410C)](https://www.npmjs.com/package/@thesvg/vue) |
| [`@thesvg/svelte`](https://www.npmjs.com/package/@thesvg/svelte) | Typed Svelte components | [![npm](https://img.shields.io/npm/v/@thesvg/svelte?style=flat-square&color=C2410C)](https://www.npmjs.com/package/@thesvg/svelte) |
| [`@thesvg/cli`](https://www.npmjs.com/package/@thesvg/cli) | CLI tool (`npx @thesvg/cli add github`) | [![npm](https://img.shields.io/npm/v/@thesvg/cli?style=flat-square&color=C2410C)](https://www.npmjs.com/package/@thesvg/cli) |
| [`@thesvg/mcp-server`](https://www.npmjs.com/package/@thesvg/mcp-server) | MCP server for AI assistants | [![npm](https://img.shields.io/npm/v/@thesvg/mcp-server?style=flat-square&color=C2410C)](https://www.npmjs.com/package/@thesvg/mcp-server) |
