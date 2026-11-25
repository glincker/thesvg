import type { Metadata } from "next";
import { BEST_PRACTICES } from "@/lib/docs-content";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";
import { T } from "@/components/t";
import { JSDELIVR_PINNED_REF } from "@/lib/docs-content";

export const metadata: Metadata = {
  title: "Best Practices",
  description: "Sizing, variant choice, CDN pinning, and dark mode best practices for theSVG brand icons.",
  openGraph: { title: "Best Practices - theSVG Docs", description: "How to use brand icons well.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/best-practices" },
};

export default function BestPracticesPage() {
  return (
    <article className="max-w-3xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <T k="docs.nav.items.best-practices" fallback="Best Practices" />
        </h1>
        <DocsAskAi pageTitle="Best Practices" />
      </div>
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
        <T k="docs.bestPractices.intro" fallback="Sizing, variant choice, CDN pinning, and dark mode, done right." />
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {BEST_PRACTICES.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border/40 bg-card/30 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
          >
            <h2 className="mb-1.5 text-sm font-semibold">
              <T k={`docs.bestPractices.${item.id}.title`} fallback={item.title} />
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <T k={`docs.bestPractices.${item.id}.body`} fallback={item.body} values={{ ref: JSDELIVR_PINNED_REF }} />
            </p>
          </div>
        ))}
      </div>
      <DocsPageFooter sourceFile="src/lib/docs-content.ts" pageTitle="Best Practices" />
    </article>
  );
}
