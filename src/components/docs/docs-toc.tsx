"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface DocsTocItem {
  id: string;
  label: string;
}

/** "On this page" right-rail TOC. Plain <a href="#id"> anchors (works with
 * zero JS); the IntersectionObserver only adds an active-heading highlight. */
export function DocsToc({ items }: Readonly<{ items: DocsTocItem[] }>) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-20 hidden h-fit w-48 shrink-0 xl:block"
    >
      <p className="mb-2 px-2 text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
        On this page
      </p>
      <div className="flex flex-col gap-0.5 border-l border-border/40 dark:border-white/[0.06]">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "-ml-px border-l px-3 py-1 text-xs transition-colors",
              active === item.id
                ? "border-orange-500 font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
