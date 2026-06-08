"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { useRouter } from "next/navigation";
import type { Collection } from "@/lib/icons";
import { categoryUrl } from "@/lib/categories";

interface SidebarShellProps {
  children: React.ReactNode;
  categoryCounts: { name: string; count: number }[];
  collections?: { name: Collection; count: number }[];
}

export function SidebarShell({ children, categoryCounts, collections = [] }: SidebarShellProps) {
  const router = useRouter();
  const sidebarOpen = useSidebarStore((s) => s.open);
  const setSidebarOpen = useSidebarStore((s) => s.setOpen);
  const favorites = useFavoritesStore((s) => s.favorites);

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

      <div className="md:pl-58">{children}</div>
    </>
  );
}
