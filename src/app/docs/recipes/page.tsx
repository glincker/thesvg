import type { Metadata } from "next";
import { RECIPES } from "@/lib/docs-recipes";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsToc } from "@/components/docs/docs-toc";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";
import { DocsHeading } from "@/components/docs/docs-heading";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Concrete build patterns for theSVG: tech-stack badges, icon pickers, accessible icon buttons, Next.js Image usage, and more.",
  openGraph: { title: "Recipes - theSVG Docs", description: "Real-world build patterns for using brand icons.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/recipes" },
};

export default function RecipesPage() {
  const tocItems = RECIPES.map((r) => ({ id: r.id, label: r.title }));

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Recipes</h1>
          <DocsAskAi pageTitle="Recipes" />
        </div>
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
          Concrete build patterns, each targeting a specific real-world use case.
        </p>
        <div className="space-y-10">
          {RECIPES.map((recipe) => (
            <section key={recipe.id} className="scroll-mt-24">
              <DocsHeading id={recipe.id}>{recipe.title}</DocsHeading>
              <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {recipe.description}
              </p>
              <div className="space-y-3">
                {recipe.snippets.map((snippet) => (
                  <DocsCodeBlock key={snippet.label} snippet={snippet} />
                ))}
              </div>
            </section>
          ))}
        </div>
        <DocsPageFooter sourceFile="src/lib/docs-recipes.ts" pageTitle="Recipes" />
      </article>
      <DocsToc items={tocItems} />
    </div>
  );
}
