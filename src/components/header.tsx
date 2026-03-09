"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Github, Menu, Moon, Plus, Search, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useSearchStore } from "@/lib/stores/search-store";
import { getAllIcons, type IconEntry } from "@/lib/icons";
import { searchIcons } from "@/lib/search";

function SubmitButton() {
  return (
    <Link href="/submit" className="group/submit relative">
      <span className="relative inline-flex h-7 items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-b from-orange-400 to-orange-600 px-3 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:from-orange-400 hover:to-orange-500 hover:shadow-[0_2px_8px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.97] active:shadow-[0_0px_1px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.1)]">
        <Plus className="h-3 w-3" />
        <span className="hidden sm:inline">Submit</span>
      </span>
    </Link>
  );
}

const ICONS_CACHE: { current: IconEntry[] | null } = { current: null };
function getCachedIcons(): IconEntry[] {
  if (!ICONS_CACHE.current) {
    ICONS_CACHE.current = getAllIcons();
  }
  return ICONS_CACHE.current;
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const isHome = pathname === "/";

  useEffect(() => {
    setIsMac(navigator.userAgent.includes("Mac"));
  }, []);

  // Search suggestions
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const icons = getCachedIcons();
    return searchIcons(icons, query).slice(0, 6);
  }, [query]);

  const showDropdown = focused && query.trim().length >= 2 && suggestions.length > 0;

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIdx(-1);
  }, [suggestions]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setFocused(false);
        if (isHome) setQuery("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isHome, setQuery]);

  const navigateToIcon = useCallback(
    (slug: string) => {
      setFocused(false);
      inputRef.current?.blur();
      router.push(`/icon/${slug}`);
    },
    [router]
  );

  function handleSearchChange(value: string) {
    setQuery(value);
    if (!isHome) {
      router.push(`/?q=${encodeURIComponent(value)}`);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (showDropdown && selectedIdx >= 0 && selectedIdx < suggestions.length) {
      navigateToIcon(suggestions[selectedIdx].slug);
      return;
    }
    setFocused(false);
    if (!isHome && query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  }

  function handleKeyNav(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full px-2 pt-2 pb-0 sm:px-3 sm:pt-2.5">
      <div className="mx-auto max-w-[1800px] rounded-2xl border border-black/[0.06] bg-background/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-black/60 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]">
        <div className="flex h-12 items-center gap-3 px-2.5 sm:px-4">
          {/* Left: menu + logo */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <Link href="/" className="group/logo flex items-center gap-1.5">
              <img
                src="/logo-transparent.svg"
                alt="theSVG"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg transition-transform duration-200 group-hover/logo:scale-105"
              />
              <span className="hidden text-[15px] font-bold tracking-tight text-foreground sm:inline">
                the<span className="text-orange-500">SVG</span>
              </span>
            </Link>
          </div>

          {/* Center: search with dropdown */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onKeyDown={handleKeyNav}
                placeholder="Search icons..."
                className="h-9 w-full rounded-xl border border-border/40 bg-muted/30 pr-16 pl-9 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-border/60 focus:bg-background focus:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] focus:ring-1 focus:ring-ring/20 dark:border-white/[0.06] dark:bg-white/[0.03] dark:focus:border-white/[0.1] dark:focus:bg-white/[0.05] dark:focus:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)]"
                aria-label="Search icons"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls="header-search-listbox"
                aria-autocomplete="list"
              />
              <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setFocused(false); }}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <kbd className="hidden rounded border border-border/40 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50 sm:inline-block dark:border-white/[0.06]">
                  {isMac ? "\u2318K" : "^K"}
                </kbd>
              </div>
            </div>

            {/* Search dropdown - positioned relative to form for full-width on mobile */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                id="header-search-listbox"
                className="absolute top-full right-0 left-0 z-50 mx-auto mt-1.5 max-w-xl overflow-hidden rounded-xl border border-border/40 bg-background/95 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.1] dark:bg-[rgba(10,10,10,0.95)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.6)]"
                role="listbox"
              >
                <div className="px-2 py-1.5">
                  <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    Suggestions
                  </p>
                  {suggestions.map((icon, i) => (
                    <button
                      key={icon.slug}
                      type="button"
                      role="option"
                      aria-selected={i === selectedIdx}
                      onMouseEnter={() => setSelectedIdx(i)}
                      onClick={() => navigateToIcon(icon.slug)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors sm:gap-3 ${
                        i === selectedIdx
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <img
                        src={icon.variants.default}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{icon.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {icon.categories[0] || icon.slug}
                        </p>
                      </div>
                      <span className="hidden shrink-0 text-[10px] text-muted-foreground/50 sm:inline">
                        {icon.slug}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="hidden border-t border-border/30 px-3 py-1.5 sm:block dark:border-white/[0.04]">
                  <p className="text-[10px] text-muted-foreground/50">
                    <kbd className="rounded border border-border/30 px-1 font-mono dark:border-white/[0.06]">&uarr;&darr;</kbd>{" "}
                    navigate{" "}
                    <kbd className="rounded border border-border/30 px-1 font-mono dark:border-white/[0.06]">&crarr;</kbd>{" "}
                    select{" "}
                    <kbd className="rounded border border-border/30 px-1 font-mono dark:border-white/[0.06]">esc</kbd>{" "}
                    close
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/extensions"
              className="hidden items-center rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
            >
              Extensions
            </Link>

            <SubmitButton />

            <div className="ml-0.5 flex items-center">
              <a
                href="https://www.npmjs.com/package/thesvg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="npm"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                <img
                  src="/icons/npm/default.svg"
                  alt="npm"
                  width={15}
                  height={15}
                  className="h-[15px] w-[15px]"
                />
              </a>
              <a
                href="https://github.com/GLINCKER/thesvg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                <Sun className="h-3.5 w-3.5 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-3.5 w-3.5 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
