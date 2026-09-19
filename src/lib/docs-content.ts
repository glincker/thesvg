/**
 * Content for /docs. Plain data (no JSX) so it stays reusable outside
 * React — e.g. a future pass could have generate-llms-txt.ts pull the
 * same framework snippets instead of hand-duplicating them, keeping the
 * human docs page and the AI-crawler llms-full.txt from drifting apart.
 *
 * All commands/props/flags here are copied from the real package READMEs
 * (packages/react, packages/vue, packages/svelte, packages/react-native,
 * packages/cli) — verify against those before changing an API shape.
 */

import type { SnippetFormat } from "@/lib/code-snippets";

export interface DocsSnippet {
  label: string;
  code: string;
  /** Omit for languages colorizeSnippet doesn't special-case (svelte, bash, json) — renders as plain mono text. */
  format?: SnippetFormat;
}

export interface FrameworkGuide {
  id: string;
  label: string;
  packageName?: string;
  npmUrl?: string;
  summary: string;
  snippets: DocsSnippet[];
}

export const FRAMEWORK_GUIDES: FrameworkGuide[] = [
  {
    id: "cdn",
    label: "CDN / Plain HTML",
    summary:
      "No install, no build step. Point an <img> tag at a CDN URL. Works with zero JavaScript.",
    snippets: [
      {
        label: "Basic usage",
        format: "html",
        code: `<img src="https://thesvg.org/icons/github/default.svg" width="24" height="24" alt="GitHub" />`,
      },
      {
        label: "Automatic dark mode (no JS)",
        format: "html",
        code: `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="https://thesvg.org/icons/github/light.svg" />\n  <img src="https://thesvg.org/icons/github/dark.svg" width="24" alt="GitHub" />\n</picture>`,
      },
    ],
  },
  {
    id: "react",
    label: "React",
    packageName: "@thesvg/react",
    npmUrl: "https://www.npmjs.com/package/@thesvg/react",
    summary:
      "Typed, tree-shakeable components. Works as a Server Component by default, no \"use client\" needed.",
    snippets: [
      { label: "Install", format: "cli", code: `npm install @thesvg/react` },
      {
        label: "Usage",
        format: "react",
        code: `import { Github, Figma } from '@thesvg/react';\n\nexport function MyComponent() {\n  return (\n    <div>\n      <Github width={24} height={24} />\n      <Figma width={32} height={32} aria-label="Figma" />\n    </div>\n  );\n}`,
      },
      {
        label: "Variants",
        format: "react",
        code: `<Github />                    {/* default mark */}\n<Github variant="mono" />     {/* monochrome */}\n<Github variant="wordmark" /> {/* text logo */}`,
      },
      {
        label: "Individual import (smallest bundle)",
        format: "react",
        code: `import Github from '@thesvg/react/github';`,
      },
    ],
  },
  {
    id: "vue",
    label: "Vue",
    packageName: "@thesvg/vue",
    npmUrl: "https://www.npmjs.com/package/@thesvg/vue",
    summary: "Typed Vue 3 render-function components. No SFC compiler required.",
    snippets: [
      { label: "Install", format: "cli", code: `npm install @thesvg/vue` },
      {
        label: "Usage",
        format: "vue",
        code: `<script setup>\nimport { Github, Figma } from "@thesvg/vue";\n</script>\n\n<template>\n  <Github width="24" height="24" />\n  <Figma width="32" height="32" aria-label="Figma" />\n</template>`,
      },
    ],
  },
  {
    id: "svelte",
    label: "Svelte",
    packageName: "@thesvg/svelte",
    npmUrl: "https://www.npmjs.com/package/@thesvg/svelte",
    summary: "Typed components for Svelte 4 and 5.",
    snippets: [
      { label: "Install", format: "cli", code: `npm install @thesvg/svelte` },
      {
        label: "Usage",
        code: `<script>\n  import { Github, Figma } from "@thesvg/svelte";\n</script>\n\n<Github width="24" height="24" />\n<Figma width="32" height="32" aria-label="Figma" />`,
      },
    ],
  },
  {
    id: "react-native",
    label: "React Native",
    packageName: "@thesvg/react-native",
    npmUrl: "https://www.npmjs.com/package/@thesvg/react-native",
    summary:
      "Renders via react-native-svg. Works in Expo Go with no config plugin and no native setup.",
    snippets: [
      {
        label: "Install",
        format: "cli",
        code: `npm install @thesvg/react-native react-native-svg`,
      },
      {
        label: "Usage",
        format: "react",
        code: `import { Github, Figma } from '@thesvg/react-native';\n\nexport function MyComponent() {\n  return (\n    <>\n      <Github size={24} />\n      <Figma size={32} color="#3b82f6" />\n    </>\n  );\n}`,
      },
    ],
  },
  {
    id: "cli",
    label: "CLI (vendor into your repo)",
    packageName: "@thesvg/cli",
    npmUrl: "https://www.npmjs.com/package/@thesvg/cli",
    summary:
      "Copies icon files straight into your project, shadcn-style. No runtime dependency to install.",
    snippets: [
      { label: "Add one icon", format: "cli", code: `npx @thesvg/cli add github` },
      {
        label: "Add several, as typed JSX",
        format: "cli",
        code: `npx @thesvg/cli add github vercel nextjs --format jsx --dir ./components/icons`,
      },
      { label: "Search the catalog", format: "cli", code: `npx @thesvg/cli search "version control"` },
    ],
  },
  {
    id: "api",
    label: "REST API",
    summary:
      "Static, CDN-cached JSON. No auth, no dynamic search endpoint — fetch the manifest once and filter client-side.",
    snippets: [
      { label: "Full icon manifest", format: "cli", code: `curl "https://thesvg.org/api/registry.json"` },
      { label: "Categories with counts", format: "cli", code: `curl "https://thesvg.org/api/categories.json"` },
      { label: "Direct SVG", format: "cli", code: `curl "https://thesvg.org/icons/openai/default.svg"` },
      {
        label: "jsDelivr mirror (recommended for high traffic)",
        format: "cli",
        code: `curl "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json"`,
      },
    ],
  },
  {
    id: "mcp",
    label: "AI Assistants (MCP)",
    packageName: "@thesvg/mcp-server",
    npmUrl: "https://www.npmjs.com/package/@thesvg/mcp-server",
    summary:
      "A local MCP server (stdio) that gives Claude Desktop, Claude Code, and Cursor tools to search and fetch icons directly.",
    snippets: [
      {
        label: "MCP config (Claude Desktop, Cursor, etc.)",
        format: "mcp",
        code: `{\n  "mcpServers": {\n    "thesvg": {\n      "command": "npx",\n      "args": ["@thesvg/mcp-server"]\n    }\n  }\n}`,
      },
    ],
  },
];

export interface BestPractice {
  title: string;
  body: string;
}

export const BEST_PRACTICES: BestPractice[] = [
  {
    title: "CDN <img> for grids, components for a known set",
    body: "Rendering hundreds or thousands of icons (a picker, a directory)? Use the CDN <img> URL pattern — zero bundle cost no matter how many you show. Reserve @thesvg/react, @thesvg/vue, or @thesvg/svelte named imports for a small, fixed set of icons referenced directly in your source, where tree-shaking keeps only what you use.",
  },
  {
    title: "Always set width and height",
    body: "An <img> has no intrinsic size until it loads, so an icon without explicit width/height (or a reserved aspect-ratio) causes layout shift as the page loads. Set both on every icon, even ones sized purely with CSS classes.",
  },
  {
    title: "Recolor via the mono variant, not CSS filters",
    body: "Need an icon to match an arbitrary text color? Use the mono variant with an inline component (it inherits currentColor) rather than CSS filter: invert() tricks — filters are lossy and don't map to arbitrary hex values.",
  },
  {
    title: "Pin the jsDelivr mirror to a release, not @main",
    body: "cdn.jsdelivr.net/gh/glincker/thesvg@main/... tracks the moving main branch. Pin to a released version (e.g. @3.3.8) in production so an upstream rename or removal can't silently change what your app renders.",
  },
  {
    title: "Use <picture> for dark mode, not JS",
    body: "Icons with both light and dark variants can switch with a pure CSS media query via <picture> — no theme-detection JavaScript, no hydration flash of the wrong variant.",
  },
  {
    title: "High-traffic apps: mirror, don't hotlink at scale",
    body: "thesvg.org's /icons/* is CDN-cached and free at scale, but very high-volume production apps should still prefer the jsDelivr mirror, or self-host by cloning the repo, so a traffic spike on your end never depends on thesvg.org's own uptime.",
  },
];

export interface Trick {
  title: string;
  body: string;
  code?: DocsSnippet;
}

export const TRICKS: Trick[] = [
  {
    title: "Render any icon by slug, without importing it",
    body: "When the icon is only known at runtime (a user's connected integrations, a CMS field), don't try to import every possible component. Build the CDN URL from the slug directly — it works for any of the 6,500+ icons with no barrel import and no bundler cost.",
    code: {
      label: "Dynamic icon",
      format: "react",
      code: `function BrandIcon({ slug, size = 24 }: { slug: string; size?: number }) {\n  return (\n    <img\n      src={\`https://thesvg.org/icons/\${slug}/default.svg\`}\n      width={size}\n      height={size}\n      alt={slug}\n    />\n  );\n}`,
    },
  },
  {
    title: "Fall back gracefully for an unknown slug",
    body: "If a slug might not exist in the catalog (e.g. it came from user input), swap to a fallback icon on load error instead of showing a broken image.",
    code: {
      label: "onError fallback",
      format: "react",
      code: `<img\n  src={\`https://thesvg.org/icons/\${slug}/default.svg\`}\n  onError={(e) => { e.currentTarget.src = "/fallback-icon.svg"; }}\n  alt={slug}\n/>`,
    },
  },
  {
    title: "Recolor an <img>-tag icon with a CSS mask",
    body: "An <img> tag can't inherit currentColor the way an inline SVG component can. To recolor one with pure CSS anyway, use it as a mask instead of a background image.",
    code: {
      label: "CSS mask recolor",
      format: "css",
      code: `.icon-mask {\n  -webkit-mask: url(https://thesvg.org/icons/github/mono.svg) center / contain no-repeat;\n  mask: url(https://thesvg.org/icons/github/mono.svg) center / contain no-repeat;\n  background-color: currentColor;\n  width: 24px;\n  height: 24px;\n}`,
    },
  },
  {
    title: "Vendor a batch of icons in one command",
    body: "Add several icons straight into your repo in a single call — useful for air-gapped CI, or when you'd rather check icons into your own codebase than fetch them at runtime.",
    code: {
      label: "Bulk add",
      format: "cli",
      code: `npx @thesvg/cli add github vercel nextjs tailwindcss vscode --format jsx --dir ./src/icons`,
    },
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Are these logos officially licensed by each brand?",
    answer:
      "No. Icons are provided under nominative fair use for identification purposes — brand marks remain the property of their respective trademark holders. Using a logo doesn't imply endorsement or partnership. See /legal and the repository's TRADEMARK.md for details.",
  },
  {
    question: "Can I use these icons commercially?",
    answer:
      "Yes, for identification purposes (e.g. \"we integrate with X\", a tech-stack badge, a payment-method list) — that's standard nominative fair use. Don't use a mark in a way that implies a partnership or endorsement that doesn't exist. When in doubt, check the brand's own guidelines, linked per-icon where available.",
  },
  {
    question: "An icon is missing a dark, light, or wordmark variant. Why?",
    answer:
      "Not every brand ships all 7 variants. default is the only one guaranteed present; the rest depend on what clean source art was available when the icon was added. If you have a clean source for a missing variant, submit it.",
  },
  {
    question: "How do I request a new brand or report an outdated logo?",
    answer:
      "Open an icon-request or icon-update submission at /submit. Pasted SVG source needs to be under 50KB, have a valid viewBox, and contain no <script> tags or embedded raster images — the submission form and triage bot will tell you if something's off.",
  },
  {
    question: "Is there a rate limit on the API?",
    answer:
      "/api/registry.json and /api/categories.json are static, CDN-cached files rather than a database-backed endpoint, so there's effectively no rate limit today. For very high request volumes, prefer the jsDelivr mirror. A separate gated API with real-time search and webhooks is on the roadmap at api.thesvg.org.",
  },
  {
    question: "Can AI assistants use theSVG directly?",
    answer:
      "Yes, via @thesvg/mcp-server — a local MCP server you add to Claude Desktop's, Claude Code's, or Cursor's MCP config (see the AI Assistants guide above). It exposes search, fetch, and category-listing tools backed by the same data as the site.",
  },
  {
    question: "Which package should I actually install?",
    answer:
      "A handful of known icons in a React, Vue, or Svelte app: use the matching framework package — it's tree-shaken and typed. An open-ended or large set (a picker, a directory): use the CDN <img> pattern instead, no bundle cost regardless of count. Want icons checked into your own repo: use the CLI.",
  },
];
