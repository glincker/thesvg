import { HelpCircle } from "lucide-react";
import type { FaqItem } from "@/lib/docs-content";

/** Native <details>/<summary> - content stays in the DOM (and in the
 * static export's HTML) whether or not it's expanded, no JS required. */
export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="scroll-mt-32">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <HelpCircle className="h-4 w-4 text-orange-500" />
        FAQ
      </h2>
      <div className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/40 dark:divide-white/[0.06] dark:border-white/[0.06]">
        {items.map((item) => (
          <details key={item.question} className="group px-4 py-3 open:bg-muted/10">
            <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
