"use client";

import { useRef } from "react";
import posthog from "posthog-js";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface CategoryPillsProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryPills({
  categories,
  selected,
  onSelect,
}: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="scrollbar-none flex gap-2 overflow-x-auto pb-1"
      >
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            posthog.capture("category_filtered", { category: null, action: "cleared" });
          }}
          className={cn(
            "group relative flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
            !selected
              ? "border-orange-500/40 bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_4px_12px_-2px_rgba(249,115,22,0.5)]"
              : "border-border bg-card text-muted-foreground hover:border-foreground/50 hover:text-foreground"
          )}
        >
          {!selected && (
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
          )}
          <SquaresFour weight={!selected ? "fill" : "regular"} className="relative h-3 w-3" />
          <span className="relative">All</span>
        </button>
        {categories.map((cat) => {
          const active = selected === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                const next = active ? null : cat;
                onSelect(next);
                posthog.capture("category_filtered", { category: cat, action: next === null ? "deselected" : "selected" });
              }}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                active
                  ? "border-orange-500/40 bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_4px_12px_-2px_rgba(249,115,22,0.5)]"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/50 hover:text-foreground"
              )}
            >
              {active && (
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
              )}
              <span className="relative">{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
