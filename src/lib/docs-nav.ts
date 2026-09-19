import { Rocket, Server, Bot, Wrench, Lightbulb, Sparkles, ArrowLeftRight, HelpCircle, type LucideIcon } from "lucide-react";

/**
 * Central docs navigation registry, used by the left sidebar and the
 * sitemap. Framework/tool sections use theSVG's own brand icons (dogfooding
 * the product in its own docs) instead of generic UI icons; sections with
 * no natural brand (API, MCP, and the non-framework guides) use Lucide.
 */

export type DocsIcon = { kind: "brand"; slug: string } | { kind: "lucide"; Icon: LucideIcon };

export interface DocsNavItem {
  href: string;
  label: string;
  icon: DocsIcon;
}

export interface DocsNavGroup {
  title: string;
  items: DocsNavItem[];
}

/** Route segments here must match a FRAMEWORK_GUIDES id in docs-content.ts. */
export const DOCS_NAV: DocsNavGroup[] = [
  {
    title: "Getting Started",
    items: [{ href: "/docs", label: "Overview", icon: { kind: "lucide", Icon: Rocket } }],
  },
  {
    title: "Frameworks & Tools",
    items: [
      { href: "/docs/cdn", label: "CDN / HTML", icon: { kind: "brand", slug: "html5" } },
      { href: "/docs/react", label: "React", icon: { kind: "brand", slug: "react" } },
      { href: "/docs/vue", label: "Vue", icon: { kind: "brand", slug: "vuedotjs" } },
      { href: "/docs/svelte", label: "Svelte", icon: { kind: "brand", slug: "svelte" } },
      { href: "/docs/react-native", label: "React Native", icon: { kind: "brand", slug: "reactnative" } },
      { href: "/docs/cli", label: "CLI", icon: { kind: "brand", slug: "npm" } },
      { href: "/docs/api", label: "REST API", icon: { kind: "lucide", Icon: Server } },
      { href: "/docs/mcp", label: "AI Assistants (MCP)", icon: { kind: "lucide", Icon: Bot } },
    ],
  },
  {
    title: "Guides",
    items: [
      { href: "/docs/recipes", label: "Recipes", icon: { kind: "lucide", Icon: Wrench } },
      { href: "/docs/best-practices", label: "Best Practices", icon: { kind: "lucide", Icon: Lightbulb } },
      { href: "/docs/tricks", label: "Tricks", icon: { kind: "lucide", Icon: Sparkles } },
      { href: "/docs/migration", label: "Migrating", icon: { kind: "lucide", Icon: ArrowLeftRight } },
    ],
  },
  {
    title: "Reference",
    items: [{ href: "/docs/faq", label: "FAQ", icon: { kind: "lucide", Icon: HelpCircle } }],
  },
];

/** kebab-case anchor id from a heading label, e.g. for on-page TOC targets. */
export function slugifyHeading(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
