import type { Metadata } from "next";
import { TRICKS } from "@/lib/docs-content";
import { slugifyHeading } from "@/lib/docs-nav";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsToc } from "@/components/docs/docs-toc";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";
import { DocsHeading } from "@/components/docs/docs-heading";

export const metadata: Metadata = {
  title: "Tricks",
  description: "Small techniques for theSVG: dynamic icons by slug, CSS-mask recoloring, preload hints, and more.",
  openGraph: { title: "Tricks - theSVG Docs", description: "Small techniques worth knowing.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/tricks" },
};

export default function TricksPage() {
  const tocItems = TRICKS.map((t) => ({ id: slugifyHeading(t.title), label: t.title }));

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Tricks</h1>
          <DocsAskAi pageTitle="Tricks" />
        </div>
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
          Small techniques worth knowing.
        </p>
        <div className="space-y-8">
          {TRICKS.map((trick) => (
            <section key={trick.title} className="scroll-mt-24">
              <DocsHeading id={slugifyHeading(trick.title)}>{trick.title}</DocsHeading>
              <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">{trick.body}</p>
              {trick.code && <DocsCodeBlock snippet={trick.code} />}
            </section>
          ))}
        </div>
        <DocsPageFooter sourceFile="src/lib/docs-content.ts" pageTitle="Tricks" />
      </article>
      <DocsToc items={tocItems} />
    </div>
  );
}
