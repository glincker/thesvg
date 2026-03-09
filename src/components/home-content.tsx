"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownAZ, ArrowDownZA, ArrowUpDown, Grid3X3, LayoutGrid, X } from "lucide-react";
import type { IconEntry } from "@/lib/icons";
import { searchIcons } from "@/lib/search";
import { Sidebar } from "@/components/layout/sidebar";
import { IconGrid } from "@/components/icons/icon-grid";
import { HomeHero } from "@/components/home-hero";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useSearchStore } from "@/lib/stores/search-store";

const SORT_OPTIONS = ["default", "az", "za"] as const;

interface HomeContentProps {
  icons: IconEntry[];
  categoryCounts: { name: string; count: number }[];
  count: number;
}

export function HomeContent({ icons, categoryCounts, count }: HomeContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sidebarOpen = useSidebarStore((s) => s.open);
  const setSidebarOpen = useSidebarStore((s) => s.setOpen);
  const favorites = useFavoritesStore((s) => s.favorites);
  const globalQuery = useSearchStore((s) => s.query);
  const setGlobalQuery = useSearchStore((s) => s.setQuery);

  // Read URL params
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category");
  const sortParam = searchParams.get("sort");
  const viewParam = (searchParams.get("view") || "comfortable") as "compact" | "comfortable";
  const favoritesParam = searchParams.get("favorites") === "true";

  const query = globalQuery;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isDefaultView = !query.trim() && !categoryParam && !sortParam && !favoritesParam;

  // Sync global store from URL (e.g. shared link)
  useEffect(() => {
    setGlobalQuery(queryParam);
  }, [queryParam, setGlobalQuery]);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  // Sync global search store changes to URL with debounce
  useEffect(() => {
    // Skip if query already matches URL to avoid loops
    const currentUrlQuery = searchParams.get("q") || "";
    if (globalQuery === currentUrlQuery) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateUrl({ q: globalQuery || null });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [globalQuery, updateUrl, searchParams]);

  const handleCategorySelect = useCallback(
    (category: string | null) => {
      updateUrl({ category, favorites: null });
      setSidebarOpen(false);
    },
    [updateUrl, setSidebarOpen]
  );

  const handleToggleFavorites = useCallback(() => {
    updateUrl({
      favorites: favoritesParam ? null : "true",
      category: null,
    });
    setSidebarOpen(false);
  }, [updateUrl, favoritesParam, setSidebarOpen]);

  const handleSortCycle = useCallback(() => {
    const current = sortParam || "default";
    const idx = SORT_OPTIONS.indexOf(current as typeof SORT_OPTIONS[number]);
    const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
    updateUrl({ sort: next === "default" ? null : next });
  }, [updateUrl, sortParam]);

  const handleViewToggle = useCallback(() => {
    updateUrl({ view: viewParam === "compact" ? null : "compact" });
  }, [updateUrl, viewParam]);

  const filtered = useMemo(() => {
    let result = icons;

    // Favorites filter
    if (favoritesParam) {
      result = result.filter((icon) => favorites.includes(icon.slug));
    }

    // Category filter
    if (categoryParam) {
      result = result.filter((icon) =>
        icon.categories.some(
          (c) => c.toLowerCase() === categoryParam.toLowerCase()
        )
      );
    }

    // Search
    if (query.trim()) {
      result = searchIcons(result, query);
    }

    // Sort
    if (sortParam === "az") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortParam === "za") {
      result = [...result].sort((a, b) => b.title.localeCompare(a.title));
    }

    return result;
  }, [icons, query, categoryParam, sortParam, favoritesParam, favorites]);

  const sidebarContent = (
    <Sidebar
      categories={categoryCounts}
      selectedCategory={categoryParam}
      onCategorySelect={handleCategorySelect}
      favoriteCount={favorites.length}
      showFavorites={favoritesParam}
      onToggleFavorites={handleToggleFavorites}
    />
  );

  return (
    <>
      {/* Desktop sidebar */}
      {sidebarContent}

      {/* Mobile sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            mobile
            categories={categoryCounts}
            selectedCategory={categoryParam}
            onCategorySelect={handleCategorySelect}
            favoriteCount={favorites.length}
            showFavorites={favoritesParam}
            onToggleFavorites={handleToggleFavorites}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="md:pl-58">
        {isDefaultView ? (
          /* ── Hero landing ── */
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
            <HomeHero
              icons={icons}
              categoryCounts={categoryCounts}
              count={count}
              onSelectIcon={() => {}}
              onCategorySelect={(cat) => updateUrl({ category: cat })}
            />
          </div>
        ) : (
          /* ── Filtered view ── */
          <>
            {/* Sticky toolbar - count + controls */}
            <div className="sticky top-[3.75rem] z-20 border-b border-border/30 bg-background/95 backdrop-blur-xl">
              <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-3 py-1.5 sm:gap-2 sm:px-4">
                {/* Count label */}
                <p className="flex-1 text-sm text-muted-foreground">
                  {favoritesParam
                    ? `${filtered.length} fav${filtered.length !== 1 ? "s" : ""}`
                    : filtered.length === count
                      ? `${count.toLocaleString()}`
                      : `${filtered.length.toLocaleString()}/${count.toLocaleString()}`}
                  {categoryParam && (
                    <span className="ml-1 font-medium text-foreground">{categoryParam}</span>
                  )}
                </p>

                {/* View + Sort controls */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={handleViewToggle}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label={viewParam === "compact" ? "Comfortable view" : "Compact view"}
                  >
                    {viewParam === "compact" ? (
                      <Grid3X3 className="h-4 w-4" />
                    ) : (
                      <LayoutGrid className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSortCycle}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {sortParam === "az" ? (
                      <ArrowDownAZ className="h-4 w-4" />
                    ) : sortParam === "za" ? (
                      <ArrowDownZA className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {sortParam === "az" ? "A-Z" : sortParam === "za" ? "Z-A" : "Sort"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {(categoryParam || favoritesParam || query.trim()) && (
              <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-3 pt-2 sm:px-4">
                {categoryParam && (
                  <button
                    type="button"
                    onClick={() => updateUrl({ category: null })}
                    className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-accent/50 px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.06] dark:bg-white/[0.06]"
                  >
                    {categoryParam}
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                {favoritesParam && (
                  <button
                    type="button"
                    onClick={handleToggleFavorites}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200/50 bg-red-50/50 px-2.5 py-0.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  >
                    Favorites
                    <X className="h-3 w-3" />
                  </button>
                )}
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => setGlobalQuery("")}
                    className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-accent/50 px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.06] dark:bg-white/[0.06]"
                  >
                    &ldquo;{query.trim()}&rdquo;
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    updateUrl({ category: null, favorites: null, q: null, sort: null });
                    setGlobalQuery("");
                  }}
                  className="text-[10px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Grid */}
            <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4">
              <IconGrid icons={filtered} view={viewParam} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
