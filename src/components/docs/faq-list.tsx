"use client";

import { useEffect, useRef } from "react";
import type { FaqItem } from "@/lib/docs-content";
import { slugifyHeading } from "@/lib/docs-nav";

/** Each question gets a stable #id so a link can point straight at it. If
 * the page loads with that hash, auto-expand and scroll to the matching
 * <details> instead of leaving it collapsed and invisible. */
export function FaqList({ items }: Readonly<{ items: FaqItem[] }>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !containerRef.current) return;
    const target = containerRef.current.querySelector<HTMLDetailsElement>(`#${CSS.escape(hash)}`);
    if (target) {
      target.open = true;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/40 dark:divide-white/[0.06] dark:border-white/[0.06]"
    >
      {items.map((item) => (
        <details
          key={item.question}
          id={slugifyHeading(item.question)}
          className="group scroll-mt-24 px-4 py-3 open:bg-muted/10"
        >
          <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
            <span className="flex items-center justify-between gap-3">
              {item.question}
              <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </span>
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
