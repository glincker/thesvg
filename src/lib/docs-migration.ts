/**
 * Short migration/decision guides for /docs. Scoped to the comparison
 * dimensions already verified on /compare (src/app/compare/page.tsx) -
 * don't add a claim here that isn't backed by that page's feature matrix.
 */

import type { DocsSnippet } from "@/lib/docs-content";

export interface MigrationGuide {
  id: string;
  title: string;
  summary: string;
  points: string[];
  snippet?: DocsSnippet;
}

export const MIGRATION_GUIDES: MigrationGuide[] = [
  {
    id: "from-simple-icons",
    title: "Migrating from Simple Icons",
    summary:
      "Simple Icons is mono-only (single color, no light/dark/wordmark variants) with years of community trust and broad tooling support. Most brand slugs carry over directly; the main change is picking a variant.",
    points: [
      "React apps using react-icons' Si-prefixed components (SiGithub, SiVercel) swap to the equivalent @thesvg/react named export (Github, Vercel).",
      "Simple Icons ships one mark per brand. theSVG's default variant is the closest equivalent; use mono explicitly if you specifically want the single-color behavior Simple Icons always gives you.",
      "If a slug doesn't exist yet in theSVG's catalog, request it at /submit rather than assuming parity - coverage differs per brand.",
    ],
    snippet: {
      label: "Before / after",
      format: "react",
      code: `// Before (react-icons wrapping Simple Icons)\nimport { SiGithub } from 'react-icons/si';\n<SiGithub size={24} />\n\n// After\nimport { Github } from '@thesvg/react';\n<Github width={24} height={24} />`,
    },
  },
  {
    id: "from-svgl",
    title: "Migrating from svgl",
    summary:
      "svgl is a SvelteKit-based browser for brand SVGs with color and wordmark variants, but no npm package - you copy SVG source by hand. If you're outside a Svelte project, or you want an installable package, theSVG covers the same ground plus CLI, REST API, and framework packages.",
    points: [
      "Copy-pasted SVG source becomes a CDN URL or a package import - no more manually re-copying when a logo updates upstream.",
      "svgl's variant model (color + wordmark) maps to theSVG's default + wordmark; theSVG additionally has mono, light, and dark where available.",
      "Staying in Svelte: swap manually-copied markup for @thesvg/svelte components (see the Svelte guide above) to get typing and future updates for free.",
    ],
  },
  {
    id: "theSVG-vs-iconify-lucide",
    title: "theSVG vs. Iconify vs. Lucide: picking the right one",
    summary:
      "These solve different problems and most projects end up using more than one. Full feature-by-feature matrix is on /compare; the short version:",
    points: [
      "Brand logos (GitHub, Stripe, AWS, your integrations list): theSVG - the largest brand-focused collection with multi-variant support.",
      "Generic UI icons (arrows, menus, settings, chevrons): Lucide - not brand-focused, designed for interface chrome.",
      "Need one API across many unrelated icon sets, brand and UI both, and don't mind a larger aggregator: Iconify.",
      "A typical app pairs theSVG for brand logos with Lucide for UI chrome - that's what thesvg.org itself does.",
    ],
  },
];
