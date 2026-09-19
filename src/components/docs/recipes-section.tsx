import { Wrench } from "lucide-react";
import type { Recipe } from "@/lib/docs-recipes";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";

export function RecipesSection({ items }: { items: Recipe[] }) {
  return (
    <section id="recipes" className="scroll-mt-32">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Wrench className="h-4 w-4 text-orange-500" />
        Recipes
      </h2>
      <div className="space-y-8">
        {items.map((recipe) => (
          <div key={recipe.id} id={recipe.id} className="scroll-mt-32">
            <h3 className="mb-1.5 text-sm font-semibold">{recipe.title}</h3>
            <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {recipe.description}
            </p>
            <div className="space-y-3">
              {recipe.snippets.map((snippet) => (
                <DocsCodeBlock key={snippet.label} snippet={snippet} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
