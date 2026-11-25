import type { Metadata } from "next";
import { TRICKS } from "@/lib/docs-content";
import { slugifyHeading } from "@/lib/docs-nav";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsHeading } from "@/components/docs/docs-heading";
import { DocsListPage } from "@/components/docs/docs-list-page";
import { T } from "@/components/t";

export const metadata: Metadata = {
  title: "Tricks",
  description: "Small techniques for theSVG: dynamic icons by slug, CSS-mask recoloring, preload hints, and more.",
  openGraph: { title: "Tricks - theSVG Docs", description: "Small techniques worth knowing.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/tricks" },
};

export default function TricksPage() {
  const tocItems = TRICKS.map((t) => ({ id: slugifyHeading(t.title), label: t.title, labelKey: `docs.tricks.${t.id}.title` }));

  return (
    <DocsListPage
      title="Tricks"
      titleKey="docs.nav.items.tricks"
      tocItems={tocItems}
      sourceFile="src/lib/docs-content.ts"
      intro={
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
          <T k="docs.tricks.intro" fallback="Small techniques worth knowing." />
        </p>
      }
    >
      <div className="space-y-8">
        {TRICKS.map((trick) => (
          <section key={trick.id} className="scroll-mt-24">
            <DocsHeading id={slugifyHeading(trick.title)} k={`docs.tricks.${trick.id}.title`}>{trick.title}</DocsHeading>
            <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground"><T k={`docs.tricks.${trick.id}.body`} fallback={trick.body} /></p>
            {trick.code && <DocsCodeBlock snippet={trick.code} />}
          </section>
        ))}
      </div>
    </DocsListPage>
  );
}
