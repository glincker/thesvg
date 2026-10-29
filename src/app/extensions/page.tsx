import { Suspense } from "react";
import {
  Bot,
  Blocks,
  Code,
  Code2,
  Package,
  Palette,
  Smartphone,
  Sparkles,
  Terminal,
  Zap,
} from "@/components/own-icons";
import { Github } from "@/components/own-icons";
import type { Metadata } from "next";
import { getCategoryCounts, getFormattedIconCount } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { withUtm } from "@/lib/external-link";
import { CategorySection, type Category } from "@/components/extensions/cards";

const iconCount = getFormattedIconCount();

export const metadata: Metadata = {
  title: "Extensions & Integrations - Figma, VS Code, React, React Native",
  description:
    `Use ${iconCount}+ free SVG icons in Figma, VS Code, Raycast, React, React Native, Vue, CLI, and more. Official Figma plugin, npm packages, MCP server, Iconify, and CDN.`,
  keywords: [
    "Figma brand icons plugin",
    "SVG icon Figma plugin",
    "SVG icon VS Code extension",
    "brand icon npm package",
    "SVG icon React component",
    "React Native brand icons",
    "Expo SVG icons",
    "Swift SVG icons SwiftUI",
    "SVG icon CLI",
    "SVG icon CDN",
    "MCP server icons",
    "Raycast SVG icons",
    "AI agent skill icons",
  ],
  openGraph: {
    title: "Extensions & Integrations | theSVG",
    description:
      "Official Figma plugin, VS Code extension, React/React Native/Vue/Svelte components, CLI, MCP server, and CDN.",
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/extensions" },
};

const CATEGORIES: Category[] = [
  {
    id: "npm",
    label: "Libraries & SDKs",
    description: "Install and import brand icons in your project",
    icon: <Package className="h-5 w-5" />,
    items: [
      {
        name: "thesvg",
        description: `The official npm package. All ${iconCount}+ icons, tree-shakeable, typed.`,
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/thesvg",
        iconSlug: "npm",
      },
      {
        name: "@thesvg/icons",
        description: "Core icon data. Tree-shakeable, dual ESM/CJS, per-icon imports.",
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/icons",
        iconSlug: "npm",
      },
      {
        name: "@thesvg/react",
        description: `${iconCount}+ typed React components. forwardRef, tree-shakeable, dark mode aware.`,
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/react",
        iconSlug: "react",
      },
      {
        name: "@thesvg/vue",
        description: `${iconCount}+ typed Vue 3 components. Render-function based, tree-shakeable, no SFC compiler needed.`,
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/vue",
        iconSlug: "vuedotjs",
      },
      {
        name: "@thesvg/svelte",
        description: `${iconCount}+ Svelte components with typed props. Works with Svelte 4 and 5, SvelteKit ready.`,
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/svelte",
        iconSlug: "svelte",
      },
      {
        name: "Python",
        description: "Community Python wrapper for the theSVG API and CDN.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "python",
      },
    ],
  },
  {
    id: "editors",
    label: "Editor Extensions",
    description: "Search and insert icons without leaving your editor",
    icon: <Code className="h-5 w-5" />,
    items: [
      {
        name: "VS Code",
        description: `Search ${iconCount} icons from the command palette. Copy SVG, JSX, CDN link, or insert at cursor.`,
        status: "available",
        cta: "Install",
        href: "https://marketplace.visualstudio.com/items?itemName=glincker.thesvg",
        iconSlug: "visual-studio-code",
      },
      {
        name: "JetBrains",
        description: "IntelliJ, WebStorm, PyCharm. Browse from the IDE tool window.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "jetbrains",
      },
      {
        name: "Neovim",
        description: "Lua plugin with Telescope picker. Insert SVG URL or inline content at cursor.",
        status: "available",
        cta: "Install",
        href: "https://github.com/glincker/thesvg/tree/main/extensions/neovim",
        iconSlug: "neovim",
      },
    ],
  },
  {
    id: "design",
    label: "Design Tools",
    description: "Drag and drop brand icons into your designs",
    icon: <Palette className="h-5 w-5" />,
    items: [
      {
        name: "Figma Plugin",
        description: `Browse ${iconCount}+ brand SVGs, variant picker, recents row, keyboard shortcuts. Insert as editable vectors.`,
        status: "available",
        cta: "Install",
        href: "https://www.figma.com/community/plugin/1612997159050367763",
        iconSlug: "figma",
      },
      {
        name: "Sketch Plugin",
        description: "Insert brand SVGs directly into Sketch artboards.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "sketch",
      },
      {
        name: "Framer",
        description: "Use CDN URLs directly. Zero config, always up to date.",
        status: "available",
        cta: "Docs",
        href: "https://www.jsdelivr.com/package/gh/glincker/thesvg",
        iconSlug: "framer",
      },
      {
        name: "draw.io / diagrams.net",
        description:
          "Category-based shape libraries of brand and dev-tool icons for architecture diagrams. Complements draw.io's built-in AWS, Azure, GCP, and Kubernetes libraries.",
        status: "available",
        cta: "Browse libraries",
        href: "/integrations/drawio",
        iconSlug: "diagramsdotnet",
      },
      {
        name: "Excalidraw",
        description: "Downloadable .excalidrawlib shape libraries of brand icons, grouped by category, for architecture and product diagrams.",
        status: "available",
        cta: "Browse libraries",
        href: "/integrations/excalidraw",
        iconSlug: "excalidraw",
      },
    ],
  },
  {
    id: "developer",
    label: "Developer Tools",
    description: "CLI, CDN, and API for programmatic access",
    icon: <Terminal className="h-5 w-5" />,
    items: [
      {
        name: "@thesvg/cli",
        description: "shadcn-style installer. npx @thesvg/cli add github copies the SVG.",
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/cli",
        iconFallback: <Terminal className="h-6 w-6 text-muted-foreground" />,
      },
      {
        name: "CDN via jsDelivr",
        description: "Serve any icon via global CDN. Use directly in HTML, CSS, or markdown.",
        status: "available",
        cta: "Docs",
        href: "https://www.jsdelivr.com/package/gh/glincker/thesvg",
        iconSlug: "jsdelivr",
      },
      {
        name: "Iconify",
        description: "Brand icons as thesvg (mono) and thesvg-color sets. Works in Mermaid diagrams, Iconify's Figma and VS Code plugins, and @iconify/react.",
        status: "available",
        cta: "Browse sets",
        href: "https://icon-sets.iconify.design/thesvg-color/",
        iconSlug: "iconify",
      },
      {
        name: "Homebrew",
        description: "Install the thesvg CLI via Homebrew. brew tap glincker/thesvg && brew install thesvg.",
        status: "available",
        cta: "brew tap",
        href: "https://github.com/glincker/homebrew-thesvg",
        iconSlug: "homebrew",
      },
      {
        name: "REST API",
        description: "Paid API coming soon at api.thesvg.org. Search, fetch metadata, retrieve SVGs programmatically.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/GLINCKER/thesvg",
        iconFallback: <Code className="h-6 w-6 text-muted-foreground" />,
      },
    ],
  },
  {
    id: "ai",
    label: "AI & Automation",
    description: "Let AI agents and launchers access brand icons",
    icon: <Bot className="h-5 w-5" />,
    items: [
      {
        name: "MCP Server",
        description: "Works with Claude, Cursor, Windsurf. Fetch icons via tool calls.",
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/mcp-server",
        iconSlug: "claude",
      },
      {
        name: "Agent Skill",
        description: "Drop-in skill for Claude Code, Cursor, and other AI agents. Install via skills.sh: npx skills add glincker/thesvg",
        status: "available",
        cta: "View on skills.sh",
        href: "https://skills.sh/glincker/thesvg",
        iconFallback: <Sparkles className="h-6 w-6 text-muted-foreground" />,
      },
      {
        name: "Raycast Extension",
        description: `Search ${iconCount} icons, copy SVG or CDN URL in one keystroke. Filter by category, preview variants.`,
        status: "available",
        cta: "Install",
        href: "https://www.raycast.com/thegdsks/thesvg",
        iconSlug: "raycast",
      },
      {
        name: "Alfred Workflow",
        description: "macOS quick access. Search anywhere, copy SVG, CDN URL, or markdown.",
        status: "available",
        cta: "Install",
        href: "https://github.com/glincker/thesvg/tree/main/extensions/alfred",
        iconSlug: "alfred",
      },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Use theSVG in no-code and creative tools",
    icon: <Blocks className="h-5 w-5" />,
    items: [
      {
        name: "Browser Extension",
        description: `Chrome, Firefox, Edge popup. Search ${iconCount}+ brand SVGs, copy SVG, CDN URL, or markdown. MV3, no telemetry.`,
        status: "coming-soon",
        cta: "View source",
        href: "https://github.com/glincker/thesvg/tree/main/extensions/browser",
        iconSlug: "google-chrome",
      },
      {
        name: "Webflow",
        description: "Embed icons via CDN URLs using the custom embed component.",
        status: "coming-soon",
        cta: "GitHub",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "webflow",
      },
      {
        name: "Notion",
        description: "Embed brand SVGs in pages using the CDN URL as an image block.",
        status: "coming-soon",
        cta: "GitHub",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "notion",
      },
      {
        name: "Blender",
        description: "Import SVGs as curves. Great for 3D logo mockups.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "blender",
      },
    ],
  },
  {
    id: "frameworks",
    label: "Framework Components",
    description: "Native components for your framework of choice",
    icon: <Code2 className="h-5 w-5" />,
    items: [
      {
        name: "@thesvg/vue",
        description: `${iconCount}+ typed Vue 3 components. Render-function based, tree-shakeable, no SFC compiler needed.`,
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/vue",
        iconSlug: "vuedotjs",
      },
      {
        name: "@thesvg/svelte",
        description: `${iconCount}+ Svelte components with typed props. Works with Svelte 4 and 5, SvelteKit ready.`,
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/svelte",
        iconSlug: "svelte",
      },
      {
        name: "Angular",
        description: "NgModule and standalone component support.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "angular",
      },
    ],
  },
  {
    id: "mobile-native",
    label: "Mobile & Native",
    description: "Ship icons in iOS, Android, and cross-platform apps",
    icon: <Smartphone className="h-5 w-5" />,
    items: [
      {
        name: "@thesvg/react-native",
        description: `${iconCount}+ icons for React Native and Expo, backed by react-native-svg. Works in Expo Go, no config plugin needed.`,
        status: "available",
        cta: "npm",
        href: "https://www.npmjs.com/package/@thesvg/react-native",
        iconSlug: "reactnative",
      },
      {
        name: "Swift Package",
        description: "Native SwiftUI icons for iOS, macOS, tvOS, watchOS, and visionOS. Install straight from the theSVG repo, no separate package needed.",
        status: "coming-soon",
        cta: "Track progress",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "swift",
      },
      {
        name: "Kotlin / Jetpack Compose",
        description: "Typed Compose ImageVector or drawable resource support for Android.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconFallback: <Smartphone className="h-6 w-6 text-muted-foreground" />,
      },
    ],
  },
];

export default function ExtensionsPage() {
  const categoryCounts = getCategoryCounts();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              Extensions & Integrations
            </h1>
            <p className="text-muted-foreground">
              Use theSVG icons everywhere you build, design, and ship.
            </p>
          </div>

          {/* Quick nav */}
          <nav
            aria-label="Jump to category"
            className="mb-12 flex flex-wrap gap-2"
          >
            {CATEGORIES.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/70 hover:text-foreground dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1]"
              >
                {category.label}
              </a>
            ))}
          </nav>

          {/* Categories */}
          <div className="space-y-14">
            {CATEGORIES.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </div>

          {/* Build Your Own CTA */}
          <div className="mt-16 overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/50 to-muted/20 dark:border-white/[0.06] dark:from-white/[0.03] dark:to-white/[0.01]">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <Zap className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Build your own</h2>
              </div>

              <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
                The API and CDN are fully open with no auth required. Build a plugin, extension, or
                workflow, then open a PR to list it here.
              </p>

              {/* CDN endpoints */}
              <div className="mb-6 space-y-1.5 rounded-lg border border-border/40 bg-background/50 p-4 font-mono text-xs">
                <div className="flex gap-3">
                  <span className="w-8 shrink-0 text-orange-500/80">GET</span>
                  <span className="text-muted-foreground">cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/<span className="text-foreground/60">{"{slug}"}</span>/default.svg</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-8 shrink-0 text-orange-500/80">GET</span>
                  <span className="text-muted-foreground">cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/<span className="text-foreground/60">{"{slug}"}</span>/<span className="text-foreground/60">{"{variant}"}</span>.svg</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-8 shrink-0 text-orange-500/80">GET</span>
                  <span className="text-muted-foreground">cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={withUtm("https://github.com/GLINCKER/thesvg", "extensions_page")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
                <a
                  href={withUtm("https://www.jsdelivr.com/package/gh/glincker/thesvg", "extensions_page")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Code className="h-4 w-4" />
                  CDN Docs
                </a>
              </div>
            </div>
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
