import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { getFormattedIconCount } from "@/lib/icons";
import { JsonLd } from "@/components/json-ld";
import { DOCS_NAV } from "@/lib/docs-nav";
import { DocsBrandIcon } from "@/components/docs/docs-nav-icon";
import { FRAMEWORK_GUIDES } from "@/lib/docs-content";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";

const count = getFormattedIconCount();

export const metadata: Metadata = {
  title: "Docs & Guides",
  description: `How to use ${count}+ brand SVG icons in React, Vue, Svelte, React Native, plain HTML, the CLI, the REST API, and AI assistants via MCP. Recipes, best practices, tricks, migration guides, and FAQ.`,
  keywords: [
    "theSVG docs",
    "SVG icon library usage guide",
    "React brand icons",
    "Vue brand icons",
    "Svelte brand icons",
    "brand icon CLI",
    "MCP server icons",
  ],
  openGraph: {
    title: "Docs & Guides",
    description: `How to use ${count}+ brand SVG icons across every major framework, the CDN, the CLI, the REST API, and AI assistants.`,
    siteName: "theSVG",
  },
  alternates: {
    canonical: "https://thesvg.org/docs",
  },
};

const CARD_DESCRIPTIONS: Record<string, string> = {
  recipes: "Concrete build patterns: tech-stack badges, icon pickers, accessible buttons, and more.",
  "best-practices": "Sizing, variant choice, CDN pinning, and dark mode done right.",
  tricks: "Small techniques: dynamic icons by slug, CSS-mask recoloring, preload hints.",
  migration: "Moving from Simple Icons, svgl, or deciding between theSVG, Iconify, and Lucide.",
  faq: "Licensing, missing variants, rate limits, and other common questions.",
};

export default function DocsPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: DOCS_NAV.flatMap((group) => group.items)
      .filter((item) => item.href !== "/docs")
      .map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.label,
        url: `https://thesvg.org${item.href}`,
      })),
  };

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-200/50 bg-orange-50/80 px-3 py-1 text-xs font-medium text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
          <BookOpen className="h-3 w-3" />
          Docs
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">Docs &amp; Guides</h1>
          <DocsAskAi pageTitle="Docs & Guides overview" />
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Everything for using {count}+ brand icons: framework guides, real-world recipes, best
          practices, tricks, migration guides, and FAQ.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Getting started</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pick the guide that matches how you&apos;re building. A handful of known icons in
          React, Vue, or Svelte: use the matching package. An open-ended or large set (a
          picker, a directory page): use the CDN guide instead, it has zero bundle cost
          regardless of how many icons you show. Checking icons into your own repo: use the
          CLI. Wiring up an AI assistant: see the MCP guide.
        </p>
      </section>

      {DOCS_NAV.filter((group) => group.title !== "Getting Started").map((group) => (
        <section key={group.title} className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">{group.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => {
              const guide = FRAMEWORK_GUIDES.find((g) => `/docs/${g.id}` === item.href);
              const description = guide?.summary ?? CARD_DESCRIPTIONS[item.href.replace("/docs/", "")] ?? "";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-xl border border-border/40 bg-card/30 p-4 transition-colors hover:border-orange-500/30 hover:bg-orange-500/[0.03] dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  {item.icon.kind === "brand" ? (
                    <DocsBrandIcon slug={item.icon.slug} className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
                  ) : (
                    <item.icon.Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      {item.label}
                      <ArrowRight className="h-3 w-3 shrink-0 -translate-x-1 text-orange-500 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <DocsPageFooter sourceFile="src/app/docs/page.tsx" pageTitle="Docs & Guides overview" />
    </>
  );
}
