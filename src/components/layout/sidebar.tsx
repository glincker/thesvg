"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Search,
  Shapes,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Collection } from "@/lib/icons";
import { COLLECTIONS_META } from "@/lib/collections-meta";
import { categoryAccentClass, filterCategories, groupCategoriesByLetter } from "@/lib/category-index";
import { AlphabetRail } from "@/components/layout/alphabet-rail";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarCollapseToggle } from "@/components/layout/sidebar-collapse-toggle";

import { cn } from "@/lib/utils";

const CATEGORY_SEARCH_DEBOUNCE_MS = 400;

interface SidebarProps {
  categories: { name: string; count: number }[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  favoriteCount: number;
  showFavorites: boolean;
  onToggleFavorites: () => void;
  mobile?: boolean;
  collections: { name: Collection; count: number }[];
  selectedCollection: Collection | null;
  onCollectionSelect: (collection: Collection | null) => void;
  /** Debounced (400ms) live category-name search, also used to filter the
   * main icon grid on pages that have one. Optional: pages without a grid
   * (categories, blog, etc.) can omit this and the search just filters the
   * list shown here. */
  onCategorySearchChange?: (value: string) => void;
  /** Current value of the URL-derived category search (e.g. from a shared
   * link or browser back/forward), so this component's own local input
   * stays in sync with it instead of always starting empty and clobbering
   * it after the first debounce fires. Omit on pages with no such URL
   * state. */
  initialCategorySearch?: string;
  /** Icon-only rail mode (desktop/tablet only, ignored when `mobile`). */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function Sidebar({
  categories,
  selectedCategory,
  onCategorySelect,
  favoriteCount,
  showFavorites,
  onToggleFavorites,
  mobile,
  collections,
  selectedCollection,
  onCollectionSelect,
  onCategorySearchChange,
  initialCategorySearch,
  collapsed = false,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const isRail = !mobile && collapsed;
  const [collectionsExpanded, setCollectionsExpanded] = useState(false);
  const [featuredExpanded, setFeaturedExpanded] = useState(false);

  const [categorySearch, setCategorySearch] = useState(initialCategorySearch ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const letterHeaderRefs = useRef(new Map<string, HTMLDivElement>());

  // Stay in sync with the URL-derived value (shared link, back/forward
  // navigation) without fighting the debounced write-back below. Adjusted
  // directly during render (React's documented pattern for this, avoids an
  // extra effect-triggered render) rather than in a useEffect.
  const [prevInitialCategorySearch, setPrevInitialCategorySearch] = useState(initialCategorySearch);
  if (initialCategorySearch !== undefined && initialCategorySearch !== prevInitialCategorySearch) {
    setPrevInitialCategorySearch(initialCategorySearch);
    setCategorySearch(initialCategorySearch);
  }

  useEffect(() => {
    if (!onCategorySearchChange) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onCategorySearchChange(categorySearch);
    }, CATEGORY_SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [categorySearch, onCategorySearchChange]);

  const filteredCategories = useMemo(
    () => filterCategories(categories, categorySearch),
    [categories, categorySearch],
  );
  const categoryGroups = useMemo(
    () => groupCategoriesByLetter(filteredCategories),
    [filteredCategories],
  );
  const availableLetters = useMemo(
    () => new Set(categoryGroups.map((g) => g.letter)),
    [categoryGroups],
  );

  const jumpToLetter = useCallback((letter: string) => {
    letterHeaderRefs.current.get(letter)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <TooltipProvider delay={300}>
      <aside
        className={cn(
          mobile
            ? "flex h-full w-full flex-col bg-background pt-6"
            : cn(
                "group/sidebar fixed top-[calc(4.25rem+var(--banner-h,0px))] left-2 z-30 hidden h-[calc(100vh-4.75rem-var(--banner-h,0px))] flex-col rounded-2xl border border-black/[0.06] bg-background/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-[width] duration-200 ease-in-out md:flex dark:border-white/[0.08] dark:bg-black/60 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]",
                collapsed ? "w-16" : "w-54",
              ),
        )}
      >
        {!mobile && <SidebarCollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />}

        {/* Navigation - pinned, always visible */}
        <SidebarNav
          collapsed={isRail}
          favoriteCount={favoriteCount}
          showFavorites={showFavorites}
          onToggleFavorites={onToggleFavorites}
        />

        {/* Everything below the pinned nav scrolls together, so Collections,
            Featured, and the long Categories list all stay reachable on short
            viewports. Collections and Featured collapse to reclaim space.
            None of this has a meaningful icon-only representation, so the
            whole section is hidden while the rail is collapsed - matching
            the Vercel/Linear/Notion rail pattern of showing only top-level
            destinations until the sidebar is expanded again. */}
        {!isRail && (
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <div className="flex flex-col px-3 pb-3">
              {/* Collections - collapsible */}
              {collections.length > 1 && (
                <div>
                  <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent dark:via-white/[0.06]" />
                  <button
                    type="button"
                    onClick={() => setCollectionsExpanded((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg px-1 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    Collections
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform duration-200",
                        collectionsExpanded && "rotate-90"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "flex flex-col gap-0.5 overflow-hidden transition-all duration-300",
                      collectionsExpanded ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    {collections.map((col) => {
                      const meta = COLLECTIONS_META[col.name];
                      const Icon = meta?.icon || Shapes;
                      const isActive = selectedCollection === col.name;
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => onCollectionSelect(isActive ? null : col.name)}
                          className={cn(
                            "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-white/[0.05]",
                            isActive && "bg-gradient-to-r from-accent/80 to-accent/40 text-accent-foreground font-medium shadow-sm shadow-black/[0.03] dark:from-white/[0.08] dark:to-white/[0.04] dark:shadow-black/20"
                          )}
                        >
                          <span className="flex items-center gap-2.5 truncate">
                            <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? meta?.color : "opacity-60")} />
                            <span className="truncate text-[13px]">{meta?.label || col.name}</span>
                          </span>
                          <span className="ml-2 shrink-0 rounded-full bg-muted/60 px-1.5 font-mono text-[10px] text-muted-foreground/60 dark:bg-white/[0.04]">
                            {col.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Featured - collapsible */}
              <div>
                <div className="mt-2 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent dark:via-white/[0.06]" />
                <button
                  type="button"
                  onClick={() => setFeaturedExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg px-1 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  Featured
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 shrink-0 transition-transform duration-200",
                      featuredExpanded && "rotate-90"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "flex flex-col gap-0.5 overflow-hidden transition-all duration-300",
                    featuredExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <Link
                    href="/category/google-2026"
                    className={cn(
                      "group flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-[13px] transition-all duration-200 hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-white/[0.05]",
                      pathname === "/category/google-2026" && "bg-gradient-to-r from-accent/80 to-accent/40 text-accent-foreground font-medium shadow-sm shadow-black/[0.03] dark:from-white/[0.08] dark:to-white/[0.04] dark:shadow-black/20",
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="truncate">Google 2026</span>
                    </span>
                    <span className="ml-2 shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500/90 via-orange-500/90 to-amber-400/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase leading-none tracking-wider text-white shadow-sm shadow-black/20">
                      NEW
                    </span>
                  </Link>
                </div>
              </div>

              {/* Categories */}
              <div className="mt-2 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent dark:via-white/[0.06]" />
              <div className="flex items-baseline justify-between px-1 pt-3 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Categories
                </p>
                {categorySearch && (
                  <span className="font-mono text-[10px] text-muted-foreground/40">
                    {filteredCategories.length}
                  </span>
                )}
              </div>
              <div className="relative mb-2 flex items-center">
                <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground/40" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories"
                  aria-label="Search categories"
                  className="w-full rounded-lg border border-border/50 bg-muted/30 py-1.5 pr-7 pl-8 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-shadow duration-200 focus:border-foreground/30 focus:bg-background focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:border-white/[0.06] dark:bg-white/[0.02] dark:focus:border-white/20 dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch("")}
                    aria-label="Clear category search"
                    className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {categorySearch && (
                <p role="status" aria-live="polite" className="sr-only">
                  {filteredCategories.length === 0
                    ? `No categories match ${categorySearch}`
                    : `${filteredCategories.length} ${filteredCategories.length === 1 ? "category" : "categories"} found`}
                </p>
              )}
              <div className="flex items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-px">
                  {categoryGroups.length === 0 && (
                    <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
                      <Search className="h-4 w-4 text-muted-foreground/30" />
                      <p className="text-[12px] text-muted-foreground/50">
                        No categories match &ldquo;{categorySearch}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => setCategorySearch("")}
                        className="text-[11px] font-medium text-orange-600 hover:underline dark:text-orange-400"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                  {categoryGroups.map((group) => (
                    <div key={group.letter}>
                      <div
                        ref={(el) => {
                          if (el) letterHeaderRefs.current.set(group.letter, el);
                          else letterHeaderRefs.current.delete(group.letter);
                        }}
                        className="sticky top-0 z-10 -mx-1 border-b border-border/30 bg-background/95 px-2 py-1 text-[10px] font-bold tracking-wide text-muted-foreground/60 backdrop-blur-sm dark:border-white/[0.05] dark:bg-black/70"
                      >
                        {group.letter}
                      </div>
                      {group.categories.map((category) => (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => onCategorySelect(category.name)}
                          className={cn(
                            "group flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-[13px] transition-all duration-200 hover:translate-x-0.5 hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-white/[0.05]",
                            selectedCategory === category.name &&
                              !showFavorites &&
                              "bg-gradient-to-r from-accent/80 to-accent/40 text-accent-foreground font-medium shadow-sm shadow-black/[0.03] dark:from-white/[0.08] dark:to-white/[0.04] dark:shadow-black/20"
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full opacity-60 transition-opacity group-hover:opacity-100",
                                categoryAccentClass(category.name),
                              )}
                            />
                            <span className="truncate">{category.name}</span>
                          </span>
                          <span className="ml-2 shrink-0 rounded-full bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground/50 transition-colors group-hover:bg-muted/80 group-hover:text-muted-foreground/70 dark:bg-white/[0.03] dark:group-hover:bg-white/[0.06]">
                            {category.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                {categoryGroups.length > 0 && (
                  <AlphabetRail
                    availableLetters={availableLetters}
                    onJump={jumpToLetter}
                    className="sticky top-2 ml-1 shrink-0 rounded-full bg-muted/40 dark:bg-white/[0.03]"
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </aside>
    </TooltipProvider>
  );
}
