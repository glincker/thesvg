import type { Metadata } from "next";
import Link from "next/link";
import { MIGRATION_GUIDES } from "@/lib/docs-migration";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsHeading } from "@/components/docs/docs-heading";
import { DocsListPage } from "@/components/docs/docs-list-page";

export const metadata: Metadata = {
  title: "Migrating from other libraries",
  description: "Migrating to theSVG from Simple Icons or svgl, and how to choose between theSVG, Iconify, and Lucide.",
  openGraph: { title: "Migrating - theSVG Docs", description: "Moving from another icon library.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/migration" },
};

export default function MigrationPage() {
  const tocItems = MIGRATION_GUIDES.map((g) => ({ id: g.id, label: g.title }));

  return (
    <DocsListPage
      title="Migrating from other libraries"
      tocItems={tocItems}
      sourceFile="src/lib/docs-migration.ts"
      intro={
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
          Full feature-by-feature comparison lives on{" "}
          <Link href="/compare" className="text-orange-600 underline underline-offset-2 dark:text-orange-400">
            /compare
          </Link>
          . These are the short, practical version.
        </p>
      }
    >
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
    </DocsListPage>
  );
}
