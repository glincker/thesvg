import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { getCategoryCounts, getFormattedIconCount } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { JsonLd } from "@/components/json-ld";
import { FRAMEWORK_GUIDES, BEST_PRACTICES, TRICKS, FAQ_ITEMS } from "@/lib/docs-content";
import { FrameworkGuideSection } from "@/components/docs/framework-guide-section";
import { BestPracticesSection } from "@/components/docs/best-practices-section";
import { TricksSection } from "@/components/docs/tricks-section";
import { FaqSection } from "@/components/docs/faq-section";
import { DocsNav, type DocsNavItem } from "@/components/docs/docs-nav";

const count = getFormattedIconCount();

export const metadata: Metadata = {
  title: "Docs & Guides - theSVG",
  description: `How to use ${count}+ brand SVG icons in React, Vue, Svelte, React Native, plain HTML, the CLI, the REST API, and AI assistants via MCP. Best practices, tricks, and FAQ.`,
  keywords: [
    "theSVG docs",
    "SVG icon library usage guide",
    "React brand icons",
    "Vue brand icons",
    "Svelte brand icons",
    "React Native brand icons",
    "SVG icon CDN usage",
    "brand icon CLI",
    "MCP server icons",
    "SVG icon FAQ",
  ],
  openGraph: {
    title: "Docs & Guides - theSVG",
    description: `How to use ${count}+ brand SVG icons across every major framework, the CDN, the CLI, the REST API, and AI assistants.`,
    siteName: "theSVG",
  },
  alternates: {
    canonical: "https://thesvg.org/docs",
  },
};

const NAV_ITEMS: DocsNavItem[] = [
  { id: "getting-started", label: "Getting started" },
  ...FRAMEWORK_GUIDES.map((g) => ({ id: g.id, label: g.label })),
  { id: "best-practices", label: "Best practices" },
  { id: "tricks", label: "Tricks" },
  { id: "faq", label: "FAQ" },
];

export default function DocsPage() {
  const categoryCounts = getCategoryCounts();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const techArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "theSVG Docs & Guides",
    description: `How to use ${count}+ brand SVG icons in React, Vue, Svelte, React Native, plain HTML, the CLI, the REST API, and AI assistants.`,
    url: "https://thesvg.org/docs",
  };

  return (
    <Suspense>
      <JsonLd data={techArticleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-200/50 bg-orange-50/80 px-3 py-1 text-xs font-medium text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
              <BookOpen className="h-3 w-3" />
              Docs
            </div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Docs &amp; Guides</h1>
            <p className="max-w-3xl text-muted-foreground">
              Everything for using {count}+ brand icons: framework guides, best practices,
              tricks, and FAQ, all on one page.
            </p>
          </div>

          {/* Sticky in-page nav */}
          <div className="sticky top-0 z-10 -mx-4 mb-8 border-b border-border/40 bg-background/90 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 dark:border-white/[0.06]">
            <DocsNav items={NAV_ITEMS} />
          </div>

          <div className="space-y-14">
            {/* Getting started */}
            <section id="getting-started" className="scroll-mt-24">
              <h2 className="mb-3 text-lg font-semibold">Getting started</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Pick the guide that matches how you&apos;re building. A handful of known icons in
                React, Vue, or Svelte: use the matching package below. An open-ended or large
                set (a picker, a directory page): use the CDN section instead, it has zero
                bundle cost regardless of how many icons you show. Checking icons into your
                own repo: use the CLI. Wiring up an AI assistant: see the MCP section.
              </p>
            </section>

            {FRAMEWORK_GUIDES.map((guide) => (
              <FrameworkGuideSection key={guide.id} guide={guide} />
            ))}

            <BestPracticesSection items={BEST_PRACTICES} />
            <TricksSection items={TRICKS} />
            <FaqSection items={FAQ_ITEMS} />
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
