import type { Metadata } from "next";
import { UiGlyph } from "@/components/ui-glyph";
import { CategorySection, type Category } from "@/components/extensions/cards";
import { withUtm } from "@/lib/external-link";
import { Github } from "@/components/own-icons";
import { GLYPHS } from "@/lib/ui-icons/glyphs";

const COUNT = GLYPHS.length;

export const metadata: Metadata = {
  title: "UI icons extensions and packages",
  description: "Use the UI icons in React, Vue, Svelte and React Native, in Figma, Raycast, VS Code, the browser, Alfred and neovim, and from the CLI and MCP server.",
  openGraph: {
    title: "UI icons: extensions and packages | theSVG",
    description: "React, Vue, Svelte, React Native, Figma, Raycast, VS Code, CLI, MCP server and CDN.",
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/ui/extensions" },
};

const npm = (name: string) => `https://www.npmjs.com/package/${name}`;

const CATEGORIES: Category[] = [
  {
    id: "npm",
    label: "Libraries & SDKs",
    description: "Install and import the UI icons in your project",
    icon: <UiGlyph name="package" className="h-6 w-6" />,
    items: [
      { name: "@thesvg/ui-react", description: `${COUNT} typed React components. One export per look, so unused looks never reach your bundle.`, status: "available", cta: "npm", href: npm("@thesvg/ui-react"), iconSlug: "react" },
      { name: "@thesvg/ui-vue", description: "Typed Vue 3 components with the same per-look exports. No SFC compiler needed.", status: "available", cta: "npm", href: npm("@thesvg/ui-vue"), iconSlug: "vuedotjs" },
      { name: "@thesvg/ui-svelte", description: "Svelte components with typed props. Works with Svelte 4 and 5.", status: "available", cta: "npm", href: npm("@thesvg/ui-svelte"), iconSlug: "svelte" },
      { name: "@thesvg/ui-react-native", description: "React Native components on react-native-svg, with a color prop because there is no currentColor.", status: "available", cta: "npm", href: npm("@thesvg/ui-react-native"), iconSlug: "react" },
      { name: "@thesvg/ui", description: "The raw SVG files in all seven looks plus the JSON manifest. For any framework or build tool.", status: "available", cta: "npm", href: npm("@thesvg/ui"), iconSlug: "npm" },
    ],
  },
  {
    id: "design",
    label: "Design & Launchers",
    description: "Find and insert icons without leaving your tools",
    icon: <UiGlyph name="palette" className="h-6 w-6" />,
    items: [
      { name: "Figma", description: "Browse UI icons in the plugin, pick one of seven looks and a color, and insert it as a vector.", status: "coming-soon", cta: "Get the plugin", href: "https://www.figma.com/community/plugin/1612997159050367763", iconSlug: "figma" },
      { name: "Raycast", description: "Search brand and UI icons from one command. Pick a look, then copy SVG, JSX or the CDN link.", status: "coming-soon", cta: "Get the extension", href: "https://www.raycast.com/thegdsks/thesvg", iconSlug: "raycast" },
      { name: "Alfred", description: "Type ui and a word, press Tab for every look, Enter to copy.", status: "available", cta: "Get workflow", href: "https://github.com/GLINCKER/thesvg/tree/main/extensions/alfred", iconSlug: "alfred" },
    ],
  },
  {
    id: "editors",
    label: "Editors & Browser",
    description: "Search and insert icons where you write code",
    icon: <UiGlyph name="code" className="h-6 w-6" />,
    items: [
      { name: "VS Code", description: "Toggle the picker to UI icons, choose a look, then copy SVG or insert at the cursor.", status: "available", cta: "Install", href: "https://marketplace.visualstudio.com/items?itemName=glincker.thesvg", iconSlug: "visual-studio-code" },
      { name: "Neovim", description: "TheSVGUI, TheSVGUIInsert and TheSVGUIPath, each with an optional look.", status: "available", cta: "View plugin", href: "https://github.com/GLINCKER/thesvg/tree/main/extensions/neovim", iconSlug: "neovim" },
      { name: "Browser extension", description: "A Brand | UI icons switch in the popup. Copied SVG keeps currentColor.", status: "available", cta: "View extension", href: "https://github.com/GLINCKER/thesvg/tree/main/extensions/browser", iconSlug: "google-chrome" },
    ],
  },
  {
    id: "tools",
    label: "CLI & AI",
    description: "Script it or let your agent add icons",
    icon: <UiGlyph name="terminal" className="h-6 w-6" />,
    items: [
      { name: "CLI", description: "npx @thesvg/cli add ui:bell --look glass. List and search with --ui.", status: "available", cta: "npm", href: npm("@thesvg/cli"), iconSlug: "npm" },
      { name: "MCP server", description: "Ask your agent for a UI icon. The kind and look parameters default to brand icons, so nothing existing changes.", status: "available", cta: "npm", href: npm("@thesvg/mcp-server"), iconFallback: <UiGlyph name="layout-grid" className="h-6 w-6 text-muted-foreground" /> },
    ],
  },
];

export default function UiExtensionsPage() {
  return (
    <div className="mx-auto max-w-6xl py-2">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">UI icons: extensions and packages</h1>
        <p className="text-muted-foreground">Use the UI icons everywhere you build, design and ship. The brand icons have their own page.</p>
      </div>

      <nav aria-label="Jump to category" className="mb-12 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <a key={category.id} href={`#${category.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/70 hover:text-foreground">
            {category.label}
          </a>
        ))}
      </nav>

      <div className="space-y-14">
        {CATEGORIES.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>

      <div className="mt-16 overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/50 to-muted/20 dark:border-white/[0.06] dark:from-white/[0.03] dark:to-white/[0.01]">
        <div className="p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <UiGlyph name="zap" className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Build your own</h2>
          </div>
          <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
            Every icon file, the manifest and one JSON file per look (every icon in that look, slug to SVG) are open with no auth. Build a plugin or workflow, then open a PR to list it here.
          </p>
          <div className="mb-6 space-y-1.5 rounded-lg border border-border/40 bg-background/50 p-4 font-mono text-xs">
            <div className="flex gap-3">
              <span className="w-8 shrink-0 text-orange-500/80">GET</span>
              <span className="min-w-0 break-all text-muted-foreground">thesvg.org/ui/<span className="text-foreground/60">{"{slug}"}</span>/<span className="text-foreground/60">{"{look}"}</span>.svg</span>
            </div>
            <div className="flex gap-3">
              <span className="w-8 shrink-0 text-orange-500/80">GET</span>
              <span className="min-w-0 break-all text-muted-foreground">cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/ui/looks/<span className="text-foreground/60">{"{look}"}</span>.json</span>
            </div>
            <div className="flex gap-3">
              <span className="w-8 shrink-0 text-orange-500/80">GET</span>
              <span className="min-w-0 break-all text-muted-foreground">cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/ui-icons.json</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={withUtm("https://github.com/GLINCKER/thesvg", "ui_extensions_page")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
            <a href={withUtm("https://www.jsdelivr.com/package/gh/glincker/thesvg", "ui_extensions_page")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              <UiGlyph name="code" className="h-5 w-5" />
              CDN docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
