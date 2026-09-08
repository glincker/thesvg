"use client";

import { useEffect, useState } from "react";
import { ListChecks, CaretDown, CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { IconEntry } from "@/lib/icons";
import { computeQualityScore } from "@/lib/icon-quality-score";

const STORAGE_KEY = "thesvg-quality-panel-open";

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

export function QualityScoreCard({ icon }: { icon: IconEntry }) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setReady(true);
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // storage blocked
    }
  }, []);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // storage blocked
      }
      return next;
    });
  }

  if (!ready) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
      </div>
    );
  }

  const { total, breakdown } = computeQualityScore(icon);
  const doneCount = breakdown.filter((b) => b.score === b.max).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Completeness</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{doneCount}/{breakdown.length}</span>
          <CaretDown
            className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          />
        </div>
      </button>
      {open && (
        <div className="animate-in slide-in-from-top-1 fade-in border-t border-border/60 p-3 duration-200">
          <div className="flex items-center gap-3">
            <MiniRing total={total} />
            <div className="min-w-0 flex-1 space-y-1.5">
              {breakdown.map((b) => {
                const done = b.score === b.max;
                return (
                  <div key={b.label} className="flex items-center gap-1.5">
                    {done ? (
                      <CheckCircle weight="fill" className="h-3.5 w-3.5 shrink-0 text-green-500" />
                    ) : (
                      <XCircle weight="fill" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
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
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/70">
            How complete this icon&apos;s assets are, not a judgment of the brand or the artwork itself. Help close the gaps via the contribution links below.
          </p>
        </div>
      )}
    </div>
  );
}
