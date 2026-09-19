import type { Metadata } from "next";
import { RECIPES } from "@/lib/docs-recipes";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsHeading } from "@/components/docs/docs-heading";
import { DocsListPage } from "@/components/docs/docs-list-page";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Concrete build patterns for theSVG: tech-stack badges, icon pickers, accessible icon buttons, Next.js Image usage, and more.",
  openGraph: { title: "Recipes - theSVG Docs", description: "Real-world build patterns for using brand icons.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/recipes" },
};

export default function RecipesPage() {
  const tocItems = RECIPES.map((r) => ({ id: r.id, label: r.title }));

  return (
    <DocsListPage
      title="Recipes"
      tocItems={tocItems}
      sourceFile="src/lib/docs-recipes.ts"
      intro={
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
          Concrete build patterns, each targeting a specific real-world use case.
        </p>
      }
    >
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
    </DocsListPage>
  );
}
