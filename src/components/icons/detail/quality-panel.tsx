"use client";

import { useEffect, useState } from "react";
import { UiGlyph } from "@/components/ui-glyph";
import { cn } from "@/lib/utils";

export interface QualityRow {
  label: string;
  score: number;
  max: number;
  hint: string;
}

function scoreColor(total: number): string {
  if (total >= 75) return "#22c55e";
  if (total >= 50) return "#f97316";
  return "#ef4444";
}

function MiniRing({ total }: { total: number }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - total / 100);
  const color = scoreColor(total);

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0 -rotate-90">
      <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

/** A collapsible score card: a ring, one row per scored part, and a footnote. Shared by the brand and UI icon pages. */
export function QualityPanel({
  title,
  total,
  rows,
  footnote,
  storageKey,
}: {
  title: string;
  total: number;
  rows: QualityRow[];
  footnote: React.ReactNode;
  storageKey: string;
}) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setReady(true);
    try {
      setOpen(localStorage.getItem(storageKey) === "1");
    } catch {
      // storage blocked
    }
  }, [storageKey]);

  function toggle() {
    const next = !open;
    try {
      localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      // storage blocked
    }
    setOpen(next);
  }

  if (!ready) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
      </div>
    );
  }

  const doneCount = rows.filter((b) => b.score === b.max).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <UiGlyph name="list-checks" className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{doneCount}/{rows.length}</span>
          <UiGlyph name="chevron-down" className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>
      {open && (
        <div className="animate-in slide-in-from-top-1 fade-in border-t border-border/60 p-3 duration-200">
          <div className="flex items-center gap-3">
            <MiniRing total={total} />
            <div className="min-w-0 flex-1 space-y-1.5">
              {rows.map((b) => {
                const done = b.score === b.max;
                return (
                  <div key={b.label} className="flex items-center gap-1.5">
                    {done ? (
                      <UiGlyph name="circle-check" look="fill" className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <UiGlyph name="circle-x" look="fill" className="h-3.5 w-3.5 text-muted-foreground/40" />
                    )}
                    <span className={cn("text-[11px]", done ? "text-foreground" : "text-muted-foreground")}>
                      {b.label}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground/60">- {b.hint}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/70">{footnote}</p>
        </div>
      )}
    </div>
  );
}
