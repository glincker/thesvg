"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Clock, Compass, Heart, MoreHorizontal, Plus } from "lucide-react";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { cn } from "@/lib/utils";

interface TabDef {
  key: "browse" | "favorites" | "recents" | "submit" | "more";
  label: string;
  href?: string;
  Icon: typeof Heart;
  isActive: (pathname: string, search: string, sheet: string) => boolean;
}

const TABS: ReadonlyArray<TabDef> = [
  {
    key: "browse",
    label: "Browse",
    href: "/",
    Icon: Compass,
    isActive: (p, search, s) =>
      s !== "more" &&
      !search.includes("favorites=true") &&
      (p === "/" || p.startsWith("/collection") || p.startsWith("/category") || p.startsWith("/icon/")),
  },
  {
    key: "favorites",
    label: "Favorites",
    href: "/?favorites=true",
    Icon: Heart,
    isActive: (_p, search, s) =>
      s !== "more" && search.includes("favorites=true"),
  },
  {
    key: "recents",
    label: "Recents",
    href: "/recents",
    Icon: Clock,
    isActive: (p, _search, s) => s !== "more" && p.startsWith("/recents"),
  },
  {
    key: "submit",
    label: "Submit",
    href: "/submit",
    Icon: Plus,
    isActive: (p, _search, s) => s !== "more" && p.startsWith("/submit"),
  },
  {
    key: "more",
    label: "More",
    Icon: MoreHorizontal,
    isActive: (_p, _search, s) => s === "more",
  },
];

export function MobileBottomDock() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const sheet = useMobileShellStore((s) => s.sheet);
  const openMore = useMobileShellStore((s) => s.openMore);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);
  const favoritesCount = useFavoritesStore((s) => s.favorites.length);

  const bouncedRef = useRef<Map<string, number>>(new Map());

  const handleBounce = useCallback((key: string, el: HTMLElement | null) => {
    if (!el) return;
    el.classList.remove("is-bounced");
    // Force reflow so the next class add re-triggers the animation.
    void el.offsetWidth;
    el.classList.add("is-bounced");
    const prev = bouncedRef.current.get(key);
    if (prev) window.clearTimeout(prev);
    const id = window.setTimeout(() => el.classList.remove("is-bounced"), 200);
    bouncedRef.current.set(key, id);
  }, []);

  return (
    <nav
      aria-label="Primary"
      className="surface-glass fixed inset-x-3 z-40 mx-auto max-w-md rounded-[24px] border border-border/40 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.55),0_2px_8px_-2px_rgba(0,0,0,0.35)] lg:hidden dark:border-white/[0.08]"
      style={{
        bottom: "max(12px, calc(var(--safe-bottom) + 12px))",
      }}
    >
      <ul className="flex items-stretch justify-around px-1.5 py-1">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname, search, sheet);
          const badge =
            tab.key === "favorites" && favoritesCount > 0
              ? favoritesCount
              : null;
          const content = (
            <span
              className={cn(
                "tap-bounce relative flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1 transition-colors",
                active
                  ? "text-orange-500"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-active={active ? "true" : undefined}
            >
              <tab.Icon
                className={cn(
                  "h-[22px] w-[22px] transition-transform",
                  active
                    ? "scale-110 [filter:drop-shadow(0_2px_6px_currentColor)]"
                    : "[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.25))] dark:[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.6))]",
                )}
                strokeWidth={active ? 2.4 : 2}
                fill={tab.key === "favorites" && active ? "currentColor" : "none"}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium leading-none">
                {tab.label}
              </span>
              {badge !== null && (
                <span
                  className="absolute top-0.5 right-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 font-mono text-[9px] font-bold text-white shadow-sm"
                  aria-label={`${badge} favorites`}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
          );

          const onTap = (e: React.MouseEvent | React.PointerEvent) => {
            const el = e.currentTarget.querySelector(".tap-bounce");
            if (el instanceof HTMLElement) handleBounce(tab.key, el);
          };

          if (tab.key === "more") {
            return (
              <li key={tab.key} className="flex-1">
                <button
                  type="button"
                  aria-label="More"
                  aria-pressed={active}
                  onClick={(e) => {
                    onTap(e);
                    if (sheet === "more") {
                      closeSheet();
                    } else {
                      openMore();
                    }
                  }}
                  className="w-full"
                >
                  {content}
                </button>
              </li>
            );
          }
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href ?? "/"}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  onTap(e);
                  if (sheet !== "none") closeSheet();
                  // Hint router with prefetch on next render via tab nav
                  if (tab.href) router.prefetch(tab.href);
                }}
                className="block w-full"
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
