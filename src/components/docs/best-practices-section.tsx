import { Lightbulb } from "lucide-react";
import type { BestPractice } from "@/lib/docs-content";

export function BestPracticesSection({ items }: { items: BestPractice[] }) {
  return (
    <section id="best-practices" className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Lightbulb className="h-4 w-4 text-orange-500" />
        Best practices
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-border/40 bg-card/30 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
          >
            <h3 className="mb-1.5 text-sm font-semibold">{item.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
