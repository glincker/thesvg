import { Sparkles } from "lucide-react";
import type { Trick } from "@/lib/docs-content";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";

export function TricksSection({ items }: { items: Trick[] }) {
  return (
    <section id="tricks" className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="h-4 w-4 text-orange-500" />
        Tricks
      </h2>
      <div className="space-y-6">
        {items.map((trick) => (
          <div key={trick.title}>
            <h3 className="mb-1.5 text-sm font-semibold">{trick.title}</h3>
            <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">{trick.body}</p>
            {trick.code && <DocsCodeBlock snippet={trick.code} />}
          </div>
        ))}
      </div>
    </section>
  );
}
