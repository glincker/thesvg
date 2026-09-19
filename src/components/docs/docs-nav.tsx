"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface DocsNavItem {
  id: string;
  label: string;
}

/**
 * Plain <a href="#id"> anchors so navigation works with zero JS (and so
 * every section stays reachable/crawlable without relying on client-side
 * tab state). The IntersectionObserver only adds an active-section
 * highlight on top of that.
 */
export function DocsNav({ items }: { items: DocsNavItem[] }) {
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

  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto pb-1">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
            active === item.id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
