import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  Check,
  X,
  Minus,
  ArrowRight,
  Layers,
  Palette,
  Terminal,
  Globe,
  Code,
  FileText,
  Package,
  ExternalLink,
  Star,
} from "lucide-react";
import { getCategoryCounts, getIconCount } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export const metadata: Metadata = {
  title: "Compare Brand Icon Libraries - theSVG vs Simple Icons vs svgl vs Lucide vs Font Awesome vs Iconify",
  description:
    "Honest feature comparison of brand SVG icon libraries. Compare theSVG, Simple Icons, svgl, Lucide, Font Awesome, Iconify, and Devicon by icon count, variants, npm packages, API, and tooling.",
  openGraph: {
    title: "Compare Brand Icon Libraries - theSVG vs Simple Icons vs svgl vs Lucide vs Font Awesome",
    description:
      "Honest feature comparison of brand SVG icon libraries. Compare theSVG, Simple Icons, svgl, Lucide, Font Awesome, Iconify, and Devicon.",
  },
  alternates: {
    canonical: "https://thesvg.org/compare",
  },
};

type Val = "yes" | "no" | "partial";

function FeatureIcon({ value }: { value: Val }) {
  if (value === "yes") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Minus className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-red-400">
      <X className="h-3 w-3" strokeWidth={3} />
    </span>
  );
}

interface LibInfo {
  name: string;
  url: string;
  icons: string;
  focus: string;
  desc: string;
  highlight?: boolean;
}

const LIBRARIES: LibInfo[] = [
  {
    name: "theSVG",
    url: "https://thesvg.org",
    icons: "4,000+",
    focus: "Brand logos",
    desc: "Largest brand SVG library with multi-variant support (light/dark/wordmark/mono). Full toolchain: npm, React, CLI, API, MCP server.",
    highlight: true,
  },
  {
    name: "Simple Icons",
    url: "https://simpleicons.org",
    icons: "3,400+",
    focus: "Brand logos",
    desc: "Established single-color brand icon library. Strong community, Figma/Raycast/Alfred plugins. Mono only, no color variants.",
  },
  {
    name: "svgl",
    url: "https://svgl.app",
    icons: "~600",
    focus: "Brand logos",
    desc: "Beautiful SvelteKit-based browser for brand SVGs. Color + wordmark variants. Smaller collection, no npm package.",
  },
  {
    name: "Lucide",
    url: "https://lucide.dev",
    icons: "1,500+",
    focus: "UI icons",
    desc: "Community fork of Feather Icons. Clean, consistent UI icons. No brand logos - strictly utility icons for interfaces.",
  },
  {
    name: "Font Awesome",
    url: "https://fontawesome.com",
    icons: "~500 brand",
    focus: "Mixed (UI + brand)",
    desc: "Iconic library with ~500 brand icons in the free tier. Font-based, larger bundle. Pro tier adds more icons and styles.",
  },
  {
    name: "Iconify",
    url: "https://iconify.design",
    icons: "200,000+",
    focus: "Aggregator",
    desc: "Meta-library aggregating 150+ icon sets. Unified API across sources. Not brand-focused, can be overwhelming for brand logos.",
  },
  {
    name: "Devicon",
    url: "https://devicon.dev",
    icons: "800+",
    focus: "Dev tools",
    desc: "Developer technology icons (languages, frameworks, tools). Limited to tech brands only. SVG and font formats.",
  },
];

interface FeatureRow {
  feature: string;
  thesvg: Val;
  simpleicons: Val;
  svgl: Val;
  lucide: Val;
  fontawesome: Val;
  iconify: Val;
  devicon: Val;
  note?: string;
}

const FEATURES: {
  category: string;
  icon: React.ElementType;
  items: FeatureRow[];
}[] = [
  {
    category: "Brand Icon Coverage",
    icon: Layers,
    items: [
      { feature: "Brand logo icons", thesvg: "yes", simpleicons: "yes", svgl: "yes", lucide: "no", fontawesome: "partial", iconify: "partial", devicon: "partial", note: "Lucide: UI only | FA: ~500 brands | Iconify: aggregated | Devicon: tech only" },
      { feature: "Color variants (light/dark)", thesvg: "yes", simpleicons: "no", svgl: "yes", lucide: "no", fontawesome: "no", iconify: "no", devicon: "partial" },
      { feature: "Mono/single-color variant", thesvg: "yes", simpleicons: "yes", svgl: "no", lucide: "yes", fontawesome: "yes", iconify: "yes", devicon: "yes" },
      { feature: "Wordmark variants", thesvg: "yes", simpleicons: "no", svgl: "yes", lucide: "no", fontawesome: "no", iconify: "no", devicon: "yes" },
      { feature: "Brand hex colors", thesvg: "yes", simpleicons: "yes", svgl: "no", lucide: "no", fontawesome: "no", iconify: "no", devicon: "yes" },
      { feature: "Brand guidelines links", thesvg: "yes", simpleicons: "no", svgl: "no", lucide: "no", fontawesome: "no", iconify: "no", devicon: "no" },
      { feature: "Category tagging", thesvg: "yes", simpleicons: "no", svgl: "yes", lucide: "yes", fontawesome: "yes", iconify: "yes", devicon: "yes" },
    ],
  },
  {
    category: "Developer Tooling",
    icon: Terminal,
    items: [
      { feature: "npm package", thesvg: "yes", simpleicons: "yes", svgl: "no", lucide: "yes", fontawesome: "yes", iconify: "yes", devicon: "yes" },
      { feature: "React components", thesvg: "yes", simpleicons: "partial", svgl: "no", lucide: "yes", fontawesome: "yes", iconify: "yes", devicon: "no", note: "Simple Icons: community wrapper" },
      { feature: "Vue components", thesvg: "no", simpleicons: "no", svgl: "no", lucide: "yes", fontawesome: "yes", iconify: "yes", devicon: "no" },
      { feature: "Svelte components", thesvg: "no", simpleicons: "no", svgl: "partial", lucide: "yes", fontawesome: "no", iconify: "yes", devicon: "no" },
      { feature: "CLI tool", thesvg: "yes", simpleicons: "no", svgl: "no", lucide: "no", fontawesome: "no", iconify: "no", devicon: "no" },
      { feature: "Tree-shakeable", thesvg: "yes", simpleicons: "yes", svgl: "no", lucide: "yes", fontawesome: "partial", iconify: "yes", devicon: "no" },
      { feature: "CDN URLs", thesvg: "yes", simpleicons: "yes", svgl: "yes", lucide: "yes", fontawesome: "yes", iconify: "yes", devicon: "yes" },
      { feature: "REST API", thesvg: "yes", simpleicons: "no", svgl: "no", lucide: "no", fontawesome: "no", iconify: "yes", devicon: "no" },
      { feature: "MCP server (AI)", thesvg: "yes", simpleicons: "no", svgl: "no", lucide: "no", fontawesome: "no", iconify: "no", devicon: "no" },
    ],
  },
  {
    category: "Ecosystem & Plugins",
    icon: Package,
    items: [
      { feature: "Figma plugin", thesvg: "no", simpleicons: "yes", svgl: "yes", lucide: "yes", fontawesome: "yes", iconify: "yes", devicon: "no" },
      { feature: "Raycast extension", thesvg: "yes", simpleicons: "yes", svgl: "yes", lucide: "yes", fontawesome: "no", iconify: "no", devicon: "no" },
      { feature: "VS Code extension", thesvg: "no", simpleicons: "no", svgl: "yes", lucide: "yes", fontawesome: "yes", iconify: "yes", devicon: "no" },
      { feature: "Composer/Packagist", thesvg: "yes", simpleicons: "yes", svgl: "no", lucide: "no", fontawesome: "yes", iconify: "no", devicon: "no" },
    ],
  },
  {
    category: "Governance & Quality",
    icon: FileText,
    items: [
      { feature: "Open source", thesvg: "yes", simpleicons: "yes", svgl: "yes", lucide: "yes", fontawesome: "partial", iconify: "yes", devicon: "yes", note: "Font Awesome: free tier is open source, Pro is proprietary" },
      { feature: "Icon submission process", thesvg: "yes", simpleicons: "yes", svgl: "yes", lucide: "yes", fontawesome: "no", iconify: "no", devicon: "yes" },
      { feature: "Trademark policy", thesvg: "yes", simpleicons: "yes", svgl: "no", lucide: "yes", fontawesome: "yes", iconify: "no", devicon: "no" },
      { feature: "Per-icon license data", thesvg: "yes", simpleicons: "yes", svgl: "no", lucide: "no", fontawesome: "no", iconify: "partial", devicon: "no" },
    ],
  },
];

type LibKey = "thesvg" | "simpleicons" | "svgl" | "lucide" | "fontawesome" | "iconify" | "devicon";

const COLUMNS: { key: LibKey; label: string; highlight?: boolean }[] = [
  { key: "thesvg", label: "theSVG", highlight: true },
  { key: "simpleicons", label: "Simple Icons" },
  { key: "svgl", label: "svgl" },
  { key: "lucide", label: "Lucide" },
  { key: "fontawesome", label: "Font Awesome" },
  { key: "iconify", label: "Iconify" },
  { key: "devicon", label: "Devicon" },
];

export default function ComparePage() {
  const categoryCounts = getCategoryCounts();
  const iconCount = getIconCount();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-10">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-200/50 bg-orange-50/80 px-3 py-1 text-xs font-medium text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
              <Palette className="h-3 w-3" />
              Honest comparison
            </div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              Compare Brand Icon Libraries
            </h1>
            <p className="max-w-3xl text-muted-foreground">
              Seven popular icon libraries compared across features, tooling, and ecosystem.
              We built this to be fair - every library has strengths. Pick what fits your project.
            </p>
          </div>

          {/* Library summary cards */}
          <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LIBRARIES.map((lib) => (
              <a
                key={lib.name}
                href={lib.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group rounded-xl border p-4 transition-colors ${
                  lib.highlight
                    ? "border-orange-500/30 bg-gradient-to-br from-orange-50/30 to-background dark:border-orange-500/20 dark:from-orange-500/5"
                    : "border-border/40 bg-card/30 hover:bg-card/50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{lib.name}</h3>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground dark:bg-white/[0.04]">
                    {lib.icons}
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">{lib.focus}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                  {lib.desc}
                </p>
              </a>
            ))}
          </div>

          {/* Feature comparison tables */}
          <div className="space-y-8">
            {FEATURES.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.category}
                  className="overflow-hidden rounded-xl border border-border/40 dark:border-white/[0.06]"
                >
                  <div className="flex items-center gap-2.5 border-b border-border/30 bg-muted/20 px-5 py-3.5 dark:border-white/[0.04] dark:bg-white/[0.02]">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">{section.category}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/20 dark:border-white/[0.04]">
                          <th className="sticky left-0 z-10 bg-background px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                            Feature
                          </th>
                          {COLUMNS.map((col) => (
                            <th
                              key={col.key}
                              className={`min-w-[70px] px-2 py-3 text-center text-[11px] font-medium ${
                                col.highlight
                                  ? "font-semibold text-orange-600 dark:text-orange-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item, i) => (
                          <tr
                            key={item.feature}
                            className={
                              i < section.items.length - 1
                                ? "border-b border-border/10 dark:border-white/[0.03]"
                                : ""
                            }
                          >
                            <td className="sticky left-0 z-10 bg-background px-4 py-2.5">
                              <span className="text-xs text-foreground">{item.feature}</span>
                              {item.note && (
                                <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground/60">
                                  {item.note}
                                </span>
                              )}
                            </td>
                            {COLUMNS.map((col) => (
                              <td key={col.key} className="px-2 py-2.5 text-center">
                                <FeatureIcon value={item[col.key]} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* When to use what */}
          <div className="mt-12 space-y-6">
            <h2 className="text-lg font-semibold">When to use what</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-50/20 to-background p-4 dark:from-orange-500/5">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4 text-orange-500" />
                  theSVG
                </h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Need brand logos with color/dark/light/wordmark variants. Want an API, CLI, or MCP server. Building with any framework.
                </p>
              </div>
              <div className="rounded-xl border border-border/40 p-4 dark:border-white/[0.06]">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  Simple Icons
                </h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Need mono brand icons only. Want the most established library with Figma, Raycast, and Alfred plugins.
                </p>
              </div>
              <div className="rounded-xl border border-border/40 p-4 dark:border-white/[0.06]">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  Lucide / Font Awesome
                </h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Need UI icons (arrows, menus, settings) not brand logos. Lucide for clean modern icons, FA for the widest selection.
                </p>
              </div>
              <div className="rounded-xl border border-border/40 p-4 dark:border-white/[0.06]">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  svgl / Iconify
                </h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  svgl for a beautiful browsing experience with color variants. Iconify to search across 150+ icon sets from one API.
                </p>
              </div>
            </div>
          </div>

          {/* Transparency note */}
          <div className="mt-10 rounded-xl border border-border/40 bg-muted/10 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <h3 className="mb-1.5 text-sm font-semibold">A note on fairness</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This comparison is maintained by the theSVG team. We respect every library listed here
              and built this to help developers make informed choices. Simple Icons has years of
              community trust. Lucide powers most modern React apps. Font Awesome is an industry
              standard. Iconify is an incredible aggregator. Each serves a different need.
              If something is inaccurate,{" "}
              <a
                href="https://github.com/GLINCKER/thesvg/issues"
                className="text-orange-600 underline underline-offset-2 dark:text-orange-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                open an issue
              </a>{" "}
              and we will correct it.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Browse {iconCount.toLocaleString()} icons
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.08]"
            >
              API Docs
            </Link>
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
