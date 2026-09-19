import type { Metadata } from "next";
import { TRICKS } from "@/lib/docs-content";
import { slugifyHeading } from "@/lib/docs-nav";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsHeading } from "@/components/docs/docs-heading";
import { DocsListPage } from "@/components/docs/docs-list-page";

export const metadata: Metadata = {
  title: "Tricks",
  description: "Small techniques for theSVG: dynamic icons by slug, CSS-mask recoloring, preload hints, and more.",
  openGraph: { title: "Tricks - theSVG Docs", description: "Small techniques worth knowing.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/tricks" },
};

export default function TricksPage() {
  const tocItems = TRICKS.map((t) => ({ id: slugifyHeading(t.title), label: t.title }));

  return (
    <DocsListPage
      title="Tricks"
      tocItems={tocItems}
      sourceFile="src/lib/docs-content.ts"
      intro={<p className="mb-8 max-w-2xl text-sm text-muted-foreground">Small techniques worth knowing.</p>}
    >
      <div className="space-y-8">
        {TRICKS.map((trick) => (
          <section key={trick.title} className="scroll-mt-24">
            <DocsHeading id={slugifyHeading(trick.title)}>{trick.title}</DocsHeading>
            <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">{trick.body}</p>
            {trick.code && <DocsCodeBlock snippet={trick.code} />}
          </section>
        ))}
      </div>
    </DocsListPage>
  );
}
