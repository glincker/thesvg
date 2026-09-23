"use client";

import { useState } from "react";
import {
  Blocks,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  Code,
  Code2,
  Eye,
  FileText,
  Grid2X2,
  Heart,
  Package,
  Palette,
  Plus,
  Shapes,
  Share,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
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

interface SidebarNavProps {
  collapsed: boolean;
  favoriteCount: number;
  showFavorites: boolean;
  onToggleFavorites: () => void;
}

/**
 * The pinned top nav block (All Icons through Submit). Extracted from
 * `Sidebar` so the collapsed rail variant of each row lives next to its
 * expanded counterpart instead of ballooning the parent file.
 */
export function SidebarNav({
  collapsed,
  favoriteCount,
  showFavorites,
  onToggleFavorites,
}: SidebarNavProps) {
  const pathname = usePathname();
  const isExtensionsPage = pathname === "/extensions";
  const [extensionsExpanded, setExtensionsExpanded] = useState(isExtensionsPage);
  const [favoritesShareCopied, setFavoritesShareCopied] = useState(false);
  const isFavoritesActive = showFavorites;
  const isAllIconsActive = !showFavorites && pathname === "/";

  const favoritesLabel =
    favoriteCount > 0 ? `Favorites (${favoriteCount})` : "Favorites";

  return (
    <nav className="flex shrink-0 flex-col gap-0.5 p-3">
      <SidebarNavItem
        collapsed={collapsed}
        icon={Grid2X2}
        label="All Icons"
        href="/"
        active={isAllIconsActive}
      />

      <SidebarNavItem
        collapsed={collapsed}
        icon={Shapes}
        label="Categories"
        href="/categories"
        active={pathname === "/categories"}
      />

      {collapsed ? (
        <SidebarNavItem
          collapsed
          icon={Heart}
          label={favoritesLabel}
          onClick={onToggleFavorites}
          active={isFavoritesActive}
          iconClassName={isFavoritesActive ? "fill-red-500 text-red-500" : undefined}
        />
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={onToggleFavorites}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/80 hover:text-accent-foreground",
              favoriteCount > 0 && "pr-9",
              isFavoritesActive &&
                "bg-gradient-to-r from-accent/80 to-accent/40 text-accent-foreground font-medium shadow-sm shadow-black/[0.03] dark:from-white/[0.08] dark:to-white/[0.04] dark:shadow-black/20",
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110",
                isFavoritesActive && "fill-red-500 text-red-500",
              )}
            />
            <span className="flex-1 text-left">Favorites</span>
            {favoriteCount > 0 && (
              <span className="rounded-full bg-red-500/10 px-1.5 font-mono text-[10px] font-semibold text-red-500 dark:bg-red-500/15">
                {favoriteCount}
              </span>
            )}
          </button>
          {/* Sibling, not nested inside the toggle button above (a <button>
              can't contain another <button> without breaking HTML/hydration). */}
          {favoriteCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const favs = localStorage.getItem("thesvg-favorites");
                if (!favs) return;
                try {
                  const parsed = JSON.parse(favs);
                  if (parsed.state && parsed.state.favorites) {
                    const url = new URL(window.location.href);
                    url.searchParams.set("favorites_list", parsed.state.favorites.join(","));
                    navigator.clipboard.writeText(url.toString());
                    setFavoritesShareCopied(true);
                    setTimeout(() => setFavoritesShareCopied(false), 1500);
                  }
                } catch { /* malformed localStorage value, nothing to share */ }
              }}
              title="Share Favorites"
              aria-label="Copy a shareable link to your favorites"
              className="absolute top-1/2 right-3 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground"
            >
              {favoritesShareCopied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Share className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Extensions - expandable when there's room, a plain link on the rail */}
      {collapsed ? (
        <SidebarNavItem
          collapsed
          icon={Blocks}
          label="Extensions"
          href="/extensions"
          active={isExtensionsPage}
        />
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setExtensionsExpanded((prev) => !prev)}
            aria-expanded={extensionsExpanded}
            aria-controls="extensions-menu"
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/80 hover:text-accent-foreground",
              isExtensionsPage &&
                "bg-gradient-to-r from-accent/80 to-accent/40 text-accent-foreground font-medium shadow-sm shadow-black/[0.03] dark:from-white/[0.08] dark:to-white/[0.04] dark:shadow-black/20",
            )}
          >
            <Blocks className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1 text-left">Extensions</span>
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200",
                extensionsExpanded && "rotate-90",
              )}
            />
          </button>

          <div
            id="extensions-menu"
            className={cn(
              "ml-3 flex flex-col gap-0.5 overflow-hidden border-l border-border/30 pl-3 transition-all duration-300 dark:border-white/[0.06]",
              extensionsExpanded ? "mt-0.5 max-h-96 opacity-100" : "max-h-0 opacity-0",
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
      )}

      <SidebarNavItem
        collapsed={collapsed}
        icon={Eye}
        label="Viewer"
        href="/viewer"
        active={pathname === "/viewer"}
        trailing={
          <span className="rounded-full bg-muted/60 px-1.5 font-mono text-[9px] uppercase text-muted-foreground/70 dark:bg-white/[0.06]">
            New
          </span>
        }
      />

      <SidebarNavItem
        collapsed={collapsed}
        icon={BookOpen}
        label="Docs"
        href="/docs"
        active={pathname.startsWith("/docs")}
      />

      <SidebarNavItem
        collapsed={collapsed}
        icon={FileText}
        label="Blog"
        href="/blog"
        active={pathname.startsWith("/blog")}
      />

      {/* Submit - highlighted */}
      <SidebarNavItem
        collapsed={collapsed}
        icon={Plus}
        label="Submit Icon"
        href="/submit"
        iconClassName="group-hover:rotate-90"
        className={cn(
          "border border-orange-500/20 bg-orange-500/5 text-orange-600 hover:border-orange-500/30 hover:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/15",
          pathname === "/submit" && "border-orange-500/40 bg-orange-500/15",
        )}
      />
    </nav>
  );
}
