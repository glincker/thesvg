"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import posthog from "posthog-js";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
}

export function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMac(navigator.userAgent.includes("Mac"));
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        onChange("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onChange]);

  return (
    <div className="relative w-full">
      <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
          if (next.trim()) {
            searchTimerRef.current = setTimeout(() => {
              posthog.capture("icon_searched", { query: next.trim(), query_length: next.trim().length });
            }, 800);
          }
        }}
        placeholder="Search icons..."
        className="h-9 w-full rounded-lg border border-border/60 bg-card/60 pr-20 pl-9 text-sm backdrop-blur-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-ring focus:bg-card focus:ring-1 focus:ring-ring"
        aria-label="Search icons"
      />
      <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1.5">
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground sm:inline-block">
          {isMac ? "\u2318K" : "Ctrl+K"}
        </kbd>
      </div>
    </div>
  );
}
