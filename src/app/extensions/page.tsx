import {
  ArrowLeft,
  Bot,
  Blocks,
  Code,
  Code2,
  ExternalLink,
  Globe,
  Palette,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extensions & Integrations - thesvg",
  description:
    "Use thesvg icons everywhere. Editor extensions, design tool plugins, npm packages, CLI tools, MCP server, and framework components for React, Vue, Svelte, and more.",
};

type Status = "available" | "coming-soon" | "community";

interface Integration {
  name: string;
  description: string;
  status: Status;
  cta: string;
  href: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: Integration[];
}

const CATEGORIES: Category[] = [
  {
    id: "editors",
    label: "Editor Extensions",
    icon: <Code className="h-5 w-5" />,
    items: [
      {
        name: "VS Code Extension",
        description:
          "Search and insert 3,800+ brand SVGs directly in your editor. Fuzzy search, preview, copy-paste.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "JetBrains Plugin",
        description:
          "IntelliJ, WebStorm, PyCharm support. Browse icons from the IDE tool window.",
        status: "community",
        cta: "Build This",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "Neovim Plugin",
        description:
          "Telescope picker for brand SVGs. Search, preview in floating window, insert path or inline SVG.",
        status: "community",
        cta: "Build This",
        href: "https://github.com/glincker/thesvg/issues",
      },
    ],
  },
  {
    id: "design",
    label: "Design Tools",
    icon: <Palette className="h-5 w-5" />,
    items: [
      {
        name: "Figma Plugin",
        description:
          "Browse and drag brand SVGs into your Figma designs. Search by name, category, or color.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "Sketch Plugin",
        description:
          "Insert brand SVGs directly into Sketch artboards. Search panel with live preview.",
        status: "community",
        cta: "Build This",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "Framer",
        description:
          "Use thesvg CDN URLs directly in Framer projects. Zero configuration, always up to date.",
        status: "available",
        cta: "View Docs",
        href: "/api",
      },
    ],
  },
  {
    id: "developer",
    label: "Developer Tools",
    icon: <Terminal className="h-5 w-5" />,
    items: [
      {
        name: "@thesvg/icons",
        description:
          "Tree-shakeable SVG icons for React, Vue, and Svelte. Typed components, zero runtime overhead.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "CLI (npx thesvg add github)",
        description:
          "shadcn-style icon installer. Run one command to copy the SVG into your project.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "CDN via jsDelivr",
        description:
          "Serve any icon via CDN with zero config. Use the URL pattern directly in HTML, CSS, or markdown.",
        status: "available",
        cta: "View Docs",
        href: "/api",
      },
    ],
  },
  {
    id: "ai",
    label: "AI & Automation",
    icon: <Bot className="h-5 w-5" />,
    items: [
      {
        name: "MCP Server",
        description:
          "Let AI agents fetch brand SVGs programmatically. Compatible with Claude, Cursor, and any MCP client.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "Raycast Extension",
        description:
          "Quick search and copy brand SVGs from Raycast. Paste SVG code or CDN URL in one keystroke.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "Alfred Workflow",
        description:
          "macOS quick access to brand SVGs via Alfred. Search from anywhere, copy to clipboard instantly.",
        status: "community",
        cta: "Build This",
        href: "https://github.com/glincker/thesvg/issues",
      },
    ],
  },
  {
    id: "frameworks",
    label: "Framework Components",
    icon: <Blocks className="h-5 w-5" />,
    items: [
      {
        name: "React (@thesvg/react)",
        description:
          "Typed React components for every brand icon. Tree-shakeable, dark mode aware, fully typed props.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "Vue (@thesvg/vue)",
        description:
          "Vue 3 components with full TypeScript support. Composition API compatible.",
        status: "coming-soon",
        cta: "Coming Soon",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "Svelte (@thesvg/svelte)",
        description:
          "Svelte components with typed props. Works with SvelteKit out of the box.",
        status: "community",
        cta: "Build This",
        href: "https://github.com/glincker/thesvg/issues",
      },
      {
        name: "Angular",
        description:
          "Angular components with NgModule and standalone component support.",
        status: "community",
        cta: "Build This",
        href: "https://github.com/glincker/thesvg/issues",
      },
    ],
  },
];

const STATUS_CONFIG: Record<
  Status,
  { label: string; classes: string }
> = {
  available: {
    label: "Available",
    classes:
      "bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20",
  },
  "coming-soon": {
    label: "Coming Soon",
    classes:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  },
  community: {
    label: "Community",
    classes:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20",
  },
};

function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

function IntegrationCard({ item }: { item: Integration }) {
  const isExternal =
    item.href.startsWith("http") || item.href.startsWith("https");

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80 hover:bg-card/80">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-medium leading-snug">{item.name}</h3>
        <StatusBadge status={item.status} />
      </div>
      <p className="mb-4 flex-1 text-sm text-muted-foreground">
        {item.description}
      </p>
      {isExternal ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          {item.cta}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <Link
          href={item.href}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          {item.cta}
        </Link>
      )}
    </div>
  );
}

function CategorySection({ category }: { category: Category }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
          {category.icon}
        </div>
        <h2 className="text-lg font-semibold">{category.label}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item) => (
          <IntegrationCard key={item.name} item={item} />
        ))}
      </div>
    </section>
  );
}

export default function ExtensionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all icons
      </Link>

      <div className="mb-10">
        <h1 className="mb-3 text-3xl font-bold">Extensions &amp; Integrations</h1>
        <p className="text-lg text-muted-foreground">
          Use thesvg icons everywhere - in your editor, design tool, terminal, or AI agent.
        </p>
      </div>

      <div className="space-y-12">
        {CATEGORIES.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>

      {/* Build an Extension CTA */}
      <div className="mt-16 rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <Code2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="mb-2 text-xl font-semibold">
              Want to build an extension for thesvg?
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              The thesvg API and CDN are fully open. No auth required for reads. Build a plugin,
              extension, or workflow using the endpoints below - then open a PR to add it to this
              page.
            </p>
            <div className="mb-5 space-y-2 overflow-x-auto rounded-lg bg-muted/50 p-4 font-mono text-xs text-muted-foreground">
              <div>
                <span className="text-foreground/60">CDN</span>{" "}
                <span>
                  https://cdn.jsdelivr.net/gh/glincker/thesvg/public/icons/[slug]/default.svg
                </span>
              </div>
              <div>
                <span className="text-foreground/60">API</span>{" "}
                <span>https://thesvg.org/api/icons</span>
              </div>
              <div>
                <span className="text-foreground/60">API</span>{" "}
                <span>https://thesvg.org/api/icons/[slug]</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/glincker/thesvg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
              >
                <Zap className="h-3.5 w-3.5" />
                View on GitHub
              </a>
              <Link
                href="/api"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Globe className="h-3.5 w-3.5" />
                API Docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
