import type { Metadata } from "next";
import Link from "next/link";
import { MIGRATION_GUIDES } from "@/lib/docs-migration";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsToc } from "@/components/docs/docs-toc";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";
import { DocsHeading } from "@/components/docs/docs-heading";

export const metadata: Metadata = {
  title: "Migrating from other libraries",
  description: "Migrating to theSVG from Simple Icons or svgl, and how to choose between theSVG, Iconify, and Lucide.",
  openGraph: { title: "Migrating - theSVG Docs", description: "Moving from another icon library.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/migration" },
};

export default function MigrationPage() {
  const tocItems = MIGRATION_GUIDES.map((g) => ({ id: g.id, label: g.title }));

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Migrating from other libraries</h1>
          <DocsAskAi pageTitle="Migrating from other libraries" />
        </div>
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
          Full feature-by-feature comparison lives on{" "}
          <Link href="/compare" className="text-orange-600 underline underline-offset-2 dark:text-orange-400">
            /compare
          </Link>
          . These are the short, practical version.
        </p>
        <div className="space-y-10">
          {MIGRATION_GUIDES.map((guide) => (
            <section key={guide.id} className="scroll-mt-24">
              <DocsHeading id={guide.id}>{guide.title}</DocsHeading>
              <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {guide.summary}
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                {guide.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              {guide.snippet && <DocsCodeBlock snippet={guide.snippet} />}
            </section>
          ))}
        </div>
        <DocsPageFooter sourceFile="src/lib/docs-migration.ts" pageTitle="Migrating from other libraries" />
      </article>
      <DocsToc items={tocItems} />
    </div>
  );
}
