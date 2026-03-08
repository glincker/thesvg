"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownAZ, ArrowDownZA, ArrowUpDown, Grid3X3, LayoutGrid } from "lucide-react";
import type { IconEntry } from "@/lib/icons";
import { searchIcons } from "@/lib/search";
import { SearchBar } from "@/components/search/search-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { IconGrid } from "@/components/icons/icon-grid";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { useSidebarStore } from "@/lib/stores/sidebar-store";

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

  // Read URL params
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category");
  const sortParam = searchParams.get("sort");
  const viewParam = (searchParams.get("view") || "comfortable") as "compact" | "comfortable";
  const favoritesParam = searchParams.get("favorites") === "true";

  const [query, setQuery] = useState(queryParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync query state from URL (e.g. shared link)
  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

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

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateUrl({ q: value || null });
      }, 400);
    },
    [updateUrl]
  );

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

  const SORT_OPTIONS = ["default", "az", "za"] as const;
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
      <div className="md:pl-56">
        {/* Sticky toolbar - single compact row */}
        <div className="sticky top-14 z-20 border-b border-border/30 bg-background/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-3 py-1.5 sm:gap-2 sm:px-4">
            {/* Search - takes remaining space */}
            <div className="flex-1">
              <SearchBar
                value={query}
                onChange={handleQueryChange}
                totalCount={count}
                filteredCount={filtered.length}
              />
            </div>

            {/* Count label */}
            <p className="hidden shrink-0 text-xs text-muted-foreground sm:block">
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

        {/* Grid */}
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4">
          <IconGrid icons={filtered} view={viewParam} />
        </div>
      </div>
    </>
  );
}
