"use client";

import { useState } from "react";
import {
  Blocks,
  Bot,
  ChevronRight,
  Cloud,
  Code,
  Code2,
  FileText,
  Grid2X2,
  Heart,
  Home,
  Package,
  Palette,
  Plus,
  Shapes,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Collection } from "@/lib/icons";

import { cn } from "@/lib/utils";

const EXTENSION_CATEGORIES = [
  { id: "npm", label: "Libraries & SDKs", icon: Package },
  { id: "editors", label: "Editor Extensions", icon: Code },
  { id: "design", label: "Design Tools", icon: Palette },
  { id: "developer", label: "Developer Tools", icon: Terminal },
  { id: "ai", label: "AI & Automation", icon: Bot },
  { id: "integrations", label: "Integrations", icon: Blocks },
  { id: "frameworks", label: "Framework Components", icon: Code2 },
];

const COLLECTION_META: Record<string, { icon: typeof Cloud; label: string; color: string }> = {
  brands: { icon: Shapes, label: "Brand Icons", color: "text-orange-500" },
  aws: { icon: Cloud, label: "AWS Architecture", color: "text-[#ff9900]" },
  azure: { icon: Cloud, label: "Azure Services", color: "text-[#0078d4]" },
  gcp: { icon: Cloud, label: "Google Cloud", color: "text-[#4285f4]" },
  k8s: { icon: Cloud, label: "Kubernetes", color: "text-[#326CE5]" },
};

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
}: SidebarProps) {
  const pathname = usePathname();
  const isExtensionsPage = pathname === "/extensions";
  const [extensionsExpanded, setExtensionsExpanded] = useState(isExtensionsPage);
  const isHomeActive = !selectedCategory && !showFavorites && !selectedCollection && pathname === "/";
  const isFavoritesActive = showFavorites;

  function handleHomeClick() {
    onCategorySelect(null);
    onCollectionSelect(null);
    if (showFavorites) {
      onToggleFavorites();
    }
  }

  const navItemClass =
    "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/80 hover:text-accent-foreground";

  const activeClass =
    "bg-gradient-to-r from-accent/80 to-accent/40 text-accent-foreground font-medium shadow-sm shadow-black/[0.03] dark:from-white/[0.08] dark:to-white/[0.04] dark:shadow-black/20";

  return (
    <aside
      className={cn(
        mobile
          ? "flex h-full w-full flex-col bg-background pt-6"
          : "fixed top-[4.25rem] left-2 z-30 hidden h-[calc(100vh-4.75rem)] w-54 flex-col rounded-2xl border border-black/[0.06] bg-background/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] backdrop-blur-2xl md:flex dark:border-white/[0.08] dark:bg-black/60 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]"
      )}
    >
      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-3">
        <Link
          href="/"
          onClick={handleHomeClick}
          className={cn(navItemClass, isHomeActive && activeClass)}
        >
          <Home className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          Home
        </Link>

        <Link
          href="/?sort=az"
          className={cn(navItemClass)}
        >
          <Grid2X2 className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          All Icons
        </Link>

        <Link
          href="/categories"
          className={cn(navItemClass, pathname === "/categories" && activeClass)}
        >
          <Shapes className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          Categories
        </Link>

        <button
          type="button"
          onClick={onToggleFavorites}
          className={cn(navItemClass, isFavoritesActive && activeClass)}
        >
          <Heart className={cn("h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110", isFavoritesActive && "fill-red-500 text-red-500")} />
          <span className="flex-1 text-left">Favorites</span>
          {favoriteCount > 0 && (
            <span className="rounded-full bg-red-500/10 px-1.5 font-mono text-[10px] font-semibold text-red-500 dark:bg-red-500/15">
              {favoriteCount}
            </span>
          )}
        </button>

        {/* Extensions - expandable */}
        <div>
          <button
            type="button"
            onClick={() => setExtensionsExpanded((prev) => !prev)}
            className={cn(
              navItemClass,
              isExtensionsPage && activeClass
            )}
          >
            <Blocks className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1 text-left">Extensions</span>
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200",
                extensionsExpanded && "rotate-90"
              )}
            />
          </button>

          <div
            className={cn(
              "ml-3 flex flex-col gap-0.5 overflow-hidden border-l border-border/30 pl-3 transition-all duration-300 dark:border-white/[0.06]",
              extensionsExpanded ? "mt-0.5 max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {EXTENSION_CATEGORIES.map((ext) => {
              const Icon = ext.icon;
              return (
                <Link
                  key={ext.id}
                  href={`/extensions#${ext.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-white/[0.05]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{ext.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/blog"
          className={cn(navItemClass, pathname.startsWith("/blog") && activeClass)}
        >
          <FileText className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          Blog
        </Link>

        {/* Submit - highlighted */}
        <Link
          href="/submit"
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-sm font-medium text-orange-600 transition-all duration-200 hover:border-orange-500/30 hover:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/15",
            pathname === "/submit" && "border-orange-500/40 bg-orange-500/15"
          )}
        >
          <Plus className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:rotate-90" />
          Submit Icon
        </Link>
      </nav>

      {/* Collections */}
      {collections.length > 1 && (
        <>
          <div className="mx-3 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent dark:via-white/[0.06]" />

          <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Collections
          </p>

          <div className="flex flex-col gap-0.5 px-3">
            {collections.map((col) => {
              const meta = COLLECTION_META[col.name];
              const Icon = meta?.icon || Shapes;
              const isActive = selectedCollection === col.name;
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => onCollectionSelect(isActive ? null : col.name)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-white/[0.05]",
                    isActive && activeClass
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
        </>
      )}

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent dark:via-white/[0.06]" />

      <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Categories
      </p>

      <ScrollArea className="flex-1 overflow-hidden px-3 pb-3">
        <div className="flex flex-col gap-px">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => onCategorySelect(category.name)}
              className={cn(
                "group flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-[13px] transition-all duration-200 hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-white/[0.05]",
                selectedCategory === category.name &&
                  !showFavorites &&
                  activeClass
              )}
            >
              <span className="truncate">{category.name}</span>
              <span className="ml-2 shrink-0 rounded-full bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground/50 transition-colors group-hover:bg-muted/80 group-hover:text-muted-foreground/70 dark:bg-white/[0.03] dark:group-hover:bg-white/[0.06]">
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
