import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import type { MigrationGuide } from "@/lib/docs-migration";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";

export function MigrationSection({ items }: { items: MigrationGuide[] }) {
  return (
    <section id="migration" className="scroll-mt-32">
      <h2 className="mb-1.5 flex items-center gap-2 text-lg font-semibold">
        <ArrowLeftRight className="h-4 w-4 text-orange-500" />
        Migrating from other libraries
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Full feature-by-feature comparison lives on{" "}
        <Link href="/compare" className="text-orange-600 underline underline-offset-2 dark:text-orange-400">
          /compare
        </Link>
        . These are the short, practical version.
      </p>
      <div className="space-y-8">
        {items.map((guide) => (
          <div key={guide.id} id={guide.id} className="scroll-mt-32">
            <h3 className="mb-1.5 text-sm font-semibold">{guide.title}</h3>
            <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {guide.summary}
            </p>
            <ul className="mb-3 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
              {guide.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {guide.snippet && <DocsCodeBlock snippet={guide.snippet} />}
          </div>
        ))}
      </div>
    </section>
  );
}
