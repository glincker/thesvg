"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { BottomSheet } from "./bottom-sheet";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";
import { useSearchStore } from "@/lib/stores/search-store";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { useIconSearch } from "@/lib/hooks/use-icon-search";
import { cn } from "@/lib/utils";

interface ChipDef {
  href: string;
  label: string;
}

const CHIPS: ReadonlyArray<ChipDef> = [
  { href: "/", label: "Brands" },
  { href: "/collection/aws", label: "AWS" },
  { href: "/collection/gcp", label: "GCP" },
  { href: "/collection/azure", label: "Azure" },
  { href: "/category/google-2026", label: "Google 2026" },
];

/**
 * Fullscreen search sheet for mobile. Three snap points:
 *   peek (~60vh, 3 results) → half (~80vh, 10 results) → full (100vh).
 * Drag handle changes snap; backdrop tap or swipe-down dismisses.
 *
 * Reuses `useIconSearch` so ranking + analytics match the desktop combobox.
 */
export function MobileSearchSheet() {
  const router = useRouter();
  const sheet = useMobileShellStore((s) => s.sheet);
  const snap = useMobileShellStore((s) => s.searchSnap);
  const setSnap = useMobileShellStore((s) => s.setSearchSnap);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const recentSearches = useRecentsStore((s) => s.searched);

  const open = sheet === "search";
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(query);

  // Snap-based limit so the user can see how the list grows at each height.
  const limit = snap === "peek" ? 6 : snap === "half" ? 12 : 30;
  const { results, isLoading } = useIconSearch({
    query: localQuery,
    source: "mobile_search_sheet",
    limit,
  });

  // Sync local state down to the global store so the desktop header
  // reflects the query when the user resizes back across breakpoints.
  useEffect(() => {
    if (open) setQuery(localQuery);
  }, [localQuery, open, setQuery]);

  // Sync up when the sheet opens (e.g. user already typed from header)
  useEffect(() => {
    if (open) setLocalQuery(query);
  }, [open, query]);

  // Autofocus when opening — defer to next frame so iOS opens the keyboard.
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  function navigate(slug: string) {
    closeSheet();
    router.push(`/icon/${slug}`);
  }

  const hasQuery = localQuery.trim().length >= 2;

  return (
    <BottomSheet
      open={open}
      onClose={closeSheet}
      snap={snap}
      onSnapChange={setSnap}
      label="Search icons"
      allowOverscroll
      className="surface-glass-solid"
    >
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search icons..."
            /* 16px on mobile blocks iOS auto-zoom. */
            className="h-11 w-full rounded-xl border border-border bg-muted/40 pr-10 pl-9 text-base shadow-sm outline-none focus:border-primary/40 focus:bg-background focus:ring-1 focus:ring-ring/30 dark:border-white/[0.08] dark:bg-white/[0.04]"
            aria-label="Search icons"
            maxLength={100}
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => setLocalQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none">
          {CHIPS.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              onClick={() => closeSheet()}
              className="shrink-0 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-accent hover:text-foreground"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-2 pb-4">
        {hasQuery ? (
          <>
            <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {isLoading ? "Searching..." : `Results · ${results.length}`}
            </p>
            <ul className="space-y-0.5">
              {results.map((icon) => (
                <li key={icon.slug}>
                  <button
                    type="button"
                    onClick={() => navigate(icon.slug)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50"
                  >
                    <img
                      src={icon.variants.default}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {icon.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {icon.categories[0] || icon.slug}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
              {!isLoading && results.length === 0 && (
                <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No icons match &ldquo;{localQuery.trim()}&rdquo;
                </li>
              )}
            </ul>
          </>
        ) : (
          <>
            {recentSearches.length > 0 && (
              <div className="px-2 pb-2">
                <p className="pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Recent searches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.slice(0, 8).map((r) => (
                    <button
                      key={r.query}
                      type="button"
                      onClick={() => setLocalQuery(r.query)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border border-border/40 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Search className="h-3 w-3" />
                      {r.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="px-2 pt-2">
              <p className="pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Try
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["stripe", "lambda", "react", "tailwind", "vercel"].map(
                  (term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setLocalQuery(term)}
                      className="rounded-full border border-border/40 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {term}
                    </button>
                  ),
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
