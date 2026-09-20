"use client";

import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { useRouter } from "next/navigation";
import type { Collection } from "@/lib/icons";
import { categoryUrl } from "@/lib/categories";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "thesvg-sidebar";
const TABLET_RAIL_QUERY = "(min-width: 768px) and (max-width: 1023px)";

interface SidebarShellProps {
  children: React.ReactNode;
  categoryCounts: { name: string; count: number }[];
  collections?: { name: Collection; count: number }[];
}

export function SidebarShell({ children, categoryCounts, collections = [] }: SidebarShellProps) {
  const router = useRouter();
  const sidebarOpen = useSidebarStore((s) => s.open);
  const setSidebarOpen = useSidebarStore((s) => s.setOpen);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const favorites = useFavoritesStore((s) => s.favorites);
  const didCheckDefault = useRef(false);

  // First-visit default for the tablet/foldable band (768-1023px): a full
  // labeled sidebar eats a large share of the already-limited width there,
  // so default to the icon-only rail the first time. Only applies when
  // there is no saved preference yet (skipHydration means the store hasn't
  // read localStorage at this point, so we check the raw key directly);
  // once the user has toggled it either way, that choice sticks.
  useEffect(() => {
    if (didCheckDefault.current) return;
    didCheckDefault.current = true;
    if (localStorage.getItem(SIDEBAR_STORAGE_KEY) !== null) return;
    if (window.matchMedia(TABLET_RAIL_QUERY).matches) {
      setCollapsed(true);
    }
  }, [setCollapsed]);

  function handleCategorySelect(category: string | null) {
    if (category) {
      router.push(categoryUrl(category));
    } else {
      router.push("/");
    }
    setSidebarOpen(false);
  }

  function handleCollectionSelect(collection: Collection | null) {
    if (collection) {
      router.push(`/collection/${encodeURIComponent(collection)}`);
    } else {
      router.push("/");
    }
    setSidebarOpen(false);
  }

  function handleToggleFavorites() {
    router.push("/?favorites=true");
    setSidebarOpen(false);
  }

  return (
    <>
      <Sidebar
        categories={categoryCounts}
        selectedCategory={null}
        onCategorySelect={handleCategorySelect}
        favoriteCount={favorites.length}
        showFavorites={false}
        onToggleFavorites={handleToggleFavorites}
        collections={collections}
        selectedCollection={null}
        onCollectionSelect={handleCollectionSelect}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            mobile
            categories={categoryCounts}
            selectedCategory={null}
            onCategorySelect={handleCategorySelect}
            favoriteCount={favorites.length}
            showFavorites={false}
            onToggleFavorites={handleToggleFavorites}
            collections={collections}
            selectedCollection={null}
            onCollectionSelect={handleCollectionSelect}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "transition-[padding] duration-200 ease-in-out",
          collapsed ? "md:pl-20" : "md:pl-58",
        )}
      >
        {children}
      </div>
    </>
  );
}
