"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, Compass, MoreHorizontal, Plus, Search } from "lucide-react";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";
import { cn } from "@/lib/utils";

interface TabDef {
  key: "browse" | "search" | "recents" | "submit" | "more";
  label: string;
  href?: string;
  Icon: typeof Search;
  isActive: (pathname: string, sheet: string) => boolean;
}

const TABS: ReadonlyArray<TabDef> = [
  {
    key: "browse",
    label: "Browse",
    href: "/",
    Icon: Compass,
    isActive: (p, s) =>
      s !== "search" && s !== "more" && (p === "/" || p.startsWith("/collection") || p.startsWith("/category") || p.startsWith("/icon/")),
  },
  {
    key: "search",
    label: "Search",
    Icon: Search,
    isActive: (_p, s) => s === "search",
  },
  {
    key: "recents",
    label: "Recents",
    href: "/recents",
    Icon: Clock,
    isActive: (p, s) => s !== "search" && s !== "more" && p.startsWith("/recents"),
  },
  {
    key: "submit",
    label: "Submit",
    href: "/submit",
    Icon: Plus,
    isActive: (p, s) => s !== "search" && s !== "more" && p.startsWith("/submit"),
  },
  {
    key: "more",
    label: "More",
    Icon: MoreHorizontal,
    isActive: (_p, s) => s === "more",
  },
];

/**
 * 5-tab dock fixed to the bottom of the viewport on mobile.
 * Glass surface, safe-area aware, 120ms tap-bounce micro-anim.
 *
 * Tabs that own a sheet (Search, More) toggle store state rather than
 * navigating; tabs that own a route (Browse, Recents, Submit) navigate
 * via prefetched <Link> for instant-feel transitions.
 */
export function MobileBottomDock() {
  const pathname = usePathname();
  const router = useRouter();
  const sheet = useMobileShellStore((s) => s.sheet);
  const openSearch = useMobileShellStore((s) => s.openSearch);
  const openMore = useMobileShellStore((s) => s.openMore);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);

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
      className="surface-glass fixed inset-x-0 bottom-0 z-40 border-t border-border/40 lg:hidden dark:border-white/[0.06]"
      style={{
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around px-1">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname, sheet);
          const content = (
            <span
              className={cn(
                "tap-bounce flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-colors",
                active
                  ? "text-orange-500"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-active={active ? "true" : undefined}
            >
              <tab.Icon
                className={cn(
                  "h-[22px] w-[22px] transition-transform",
                  active && "scale-110",
                )}
                strokeWidth={active ? 2.4 : 2}
                aria-hidden="true"
              />
              <span className="text-[10.5px] font-medium leading-none">
                {tab.label}
              </span>
            </span>
          );

          const onTap = (e: React.MouseEvent | React.PointerEvent) => {
            const el = e.currentTarget.querySelector(".tap-bounce");
            if (el instanceof HTMLElement) handleBounce(tab.key, el);
          };

          if (tab.key === "search") {
            return (
              <li key={tab.key} className="flex-1">
                <button
                  type="button"
                  aria-label="Open search"
                  aria-pressed={active}
                  onClick={(e) => {
                    onTap(e);
                    if (sheet === "search") {
                      closeSheet();
                    } else {
                      openSearch("peek");
                    }
                  }}
                  className="w-full"
                >
                  {content}
                </button>
              </li>
            );
          }
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
