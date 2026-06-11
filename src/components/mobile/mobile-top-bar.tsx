"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Moon, Search, Sun, X } from "lucide-react";
import { TheSVGMark } from "@/components/icons/the-svg-mark";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSearchStore } from "@/lib/stores/search-store";

export const MOBILE_FOCUS_SEARCH_EVENT = "thesvg:mobile-focus-search";

export function MobileTopBar() {
  const { theme, setTheme } = useTheme();
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function onFocus() {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    window.addEventListener(MOBILE_FOCUS_SEARCH_EVENT, onFocus);
    return () => window.removeEventListener(MOBILE_FOCUS_SEARCH_EVENT, onFocus);
  }, []);

  function onChange(value: string) {
    setQuery(value);
    // If we're not on home, focusing a search jumps to home so the
    // result grid is visible. Mirrors the desktop combobox behavior.
    if (!pathname.startsWith("/") || pathname.length > 1) {
      router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
    }
  }

  return (
    <header
      className="surface-glass fixed inset-x-3 z-30 mx-auto max-w-md rounded-[24px] border border-border/40 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.55),0_2px_8px_-2px_rgba(0,0,0,0.35)] lg:hidden dark:border-white/[0.08]"
      style={{
        top: "max(12px, calc(var(--safe-top) + 12px))",
      }}
    >
      <div className="flex h-12 items-center gap-2 px-2">
        <Link
          href="/"
          aria-label="thesvg home"
          className="flex shrink-0 items-center gap-1.5 text-foreground [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.2))] dark:[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.5))]"
        >
          <TheSVGMark className="h-7 w-7 rounded-md" />
          <span className="text-[14px] font-bold tracking-tight text-foreground">
            the<span className="text-orange-500">SVG</span>
          </span>
        </Link>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search icons"
            aria-label="Search icons"
            maxLength={100}
            /* text-base on mobile blocks iOS auto-zoom on focus.
               Stronger 1px border so the input reads as an input, not
               a chip, against the glass top bar. Inner highlight on
               focus communicates active state without screaming. */
            className="h-9 w-full rounded-full border border-foreground/15 bg-muted/50 pr-8 pl-8 text-base text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none transition-all placeholder:text-sm placeholder:text-muted-foreground/70 focus:border-orange-500/60 focus:bg-background focus:ring-[3px] focus:ring-orange-500/20 md:text-sm md:placeholder:text-sm dark:border-white/[0.14] dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:placeholder:text-muted-foreground/60 dark:focus:border-orange-500/70 dark:focus:bg-white/[0.08]"
          />
          {query && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
        </Button>
      </div>
    </header>
  );
}
