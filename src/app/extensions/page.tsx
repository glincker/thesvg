import { Suspense } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Blocks,
  Code,
  Code2,
  Github,
  Package,
  Palette,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategoryCounts, getFormattedIconCount } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export const metadata: Metadata = {
  title: "Extensions & Integrations",
  description:
    "Use theSVG icons everywhere - VS Code, Figma, Raycast, React, CLI, and more.",
};

type Status = "available" | "coming-soon" | "community";

interface Integration {
  name: string;
  description: string;
  status: Status;
  cta: string;
  href: string;
  iconSlug?: string;
  iconFallback?: React.ReactNode;
}

interface Category {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  items: Integration[];
}

const iconCount = getFormattedIconCount();

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
        description: "Fuzzy search, inline preview, one-click paste. Cmd+Shift+P to insert.",
        status: "coming-soon",
        cta: "GitHub",
        href: "https://github.com/GLINCKER/thesvg/issues",
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
        description: "Telescope picker with floating preview. Insert path or inline SVG.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
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
        description: "Browse, search by name or color, drag into your canvas.",
        status: "coming-soon",
        cta: "GitHub",
        href: "https://github.com/GLINCKER/thesvg/issues",
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
        href: "/api-docs",
        iconSlug: "framer",
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
        href: "/api-docs",
        iconSlug: "jsdelivr",
      },
      {
        name: "REST API",
        description: "Open API. Search, fetch metadata, retrieve SVGs programmatically.",
        status: "available",
        cta: "Docs",
        href: "/api-docs",
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
        name: "Raycast Extension",
        description: "Search 4,000+ brand icons, copy SVG or CDN URL in one keystroke. Filter by category, preview variants.",
        status: "available",
        cta: "GitHub",
        href: "https://github.com/GLINCKER/thesvg/tree/main/extensions/raycast",
        iconSlug: "raycast",
      },
      {
        name: "Alfred Workflow",
        description: "macOS quick access. Search from anywhere, copy to clipboard.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
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
        name: "Vue",
        description: "Vue 3 components. Composition API compatible, fully typed.",
        status: "coming-soon",
        cta: "GitHub",
        href: "https://github.com/GLINCKER/thesvg/issues",
        iconSlug: "vuedotjs",
      },
      {
        name: "Svelte",
        description: "Svelte components with typed props. SvelteKit ready.",
        status: "community",
        cta: "Build this",
        href: "https://github.com/GLINCKER/thesvg/issues",
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
];

const STATUS_CONFIG: Record<Status, { dot: string; label: string }> = {
  available: { dot: "bg-green-500", label: "Published" },
  "coming-soon": { dot: "bg-orange-500", label: "Planned" },
  community: { dot: "bg-blue-500", label: "Open" },
};

function BrandIcon({ slug, fallback }: { slug?: string; fallback?: React.ReactNode }) {
  if (slug) {
    return (
       
      <img
        src={`/icons/${slug}/default.svg`}
        alt=""
        width={24}
        height={24}
        className="h-6 w-6"
      />
    );
  }
  return <>{fallback}</>;
}

function ExtLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
        <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover/link:opacity-100" />
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
      <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover/link:opacity-100" />
    </Link>
  );
}

function IntegrationCard({ item }: { item: Integration }) {
  const status = STATUS_CONFIG[item.status];

  return (
    <div className="group relative flex flex-col rounded-xl border border-border/40 bg-card/30 p-5 transition-all duration-200 hover:border-border/70 hover:bg-card/60 hover:shadow-xl hover:shadow-black/5 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04] dark:hover:shadow-black/40">
      {/* Header row: icon + status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/80">
          <BrandIcon slug={item.iconSlug} fallback={item.iconFallback} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          <span className="text-[11px] text-muted-foreground">{status.label}</span>
        </div>
      </div>

      {/* Name */}
      <h3 className="mb-1.5 text-sm font-semibold">{item.name}</h3>

      {/* Description */}
      <p className="mb-5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {item.description}
      </p>

      {/* CTA link */}
      <ExtLink
        href={item.href}
        className="group/link inline-flex w-fit items-center gap-1.5 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
      >
        {item.cta}
      </ExtLink>
    </div>
  );
}

function CategorySection({ category }: { category: Category }) {
  return (
    <section id={category.id} className="scroll-mt-20">
      <div className="mb-5">
        <div className="mb-1.5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/80 text-foreground/80">
            {category.icon}
          </div>
          <h2 className="text-base font-semibold">{category.label}</h2>
        </div>
        <p className="ml-[38px] text-sm text-muted-foreground">{category.description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item) => (
          <IntegrationCard key={item.name} item={item} />
        ))}
      </div>
    </section>
  );
}

export default function ExtensionsPage() {
  const categoryCounts = getCategoryCounts();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              Extensions & Integrations
            </h1>
            <p className="text-muted-foreground">
              Use theSVG icons everywhere you build, design, and ship.
            </p>
          </div>

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

              {/* API endpoints */}
              <div className="mb-6 space-y-1.5 rounded-lg border border-border/40 bg-background/50 p-4 font-mono text-xs">
                <div className="flex gap-3">
                  <span className="w-8 shrink-0 text-orange-500/80">GET</span>
                  <span className="text-muted-foreground">thesvg.org/icons/<span className="text-foreground/60">{"{slug}"}</span>/<span className="text-foreground/60">{"{variant}"}</span>.svg</span>
                </div>
                <div className="flex gap-3">
                  <span className="w-8 shrink-0 text-orange-500/80">GET</span>
                  <span className="text-muted-foreground">thesvg.org/api/icons?q=<span className="text-foreground/60">{"{query}"}</span></span>
                </div>
                <div className="flex gap-3">
                  <span className="w-8 shrink-0 text-orange-500/80">GET</span>
                  <span className="text-muted-foreground">thesvg.org/api/registry/<span className="text-foreground/60">{"{slug}"}</span></span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/GLINCKER/thesvg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
                <Link
                  href="/api-docs"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Code className="h-4 w-4" />
                  API Reference
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
