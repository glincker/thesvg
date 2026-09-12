"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, FileText, Menu, Moon, Package, Plus, Search, Sparkles, Sun, X } from "lucide-react";
import { Github } from "@/components/icons/shared/brand-icons";
import { TheSVGMark } from "@/components/icons/the-svg-mark";
import { useTheme } from "next-themes";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { FORMAT_BUTTONS } from "@/components/icons/shared/icon-constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useSearchStore } from "@/lib/stores/search-store";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { getCollections, type IconEntry } from "@/lib/icons";
import { COLLECTIONS_LIST } from "@/lib/collections-meta";
import { loadIconsManifest } from "@/lib/icons-manifest";
import { cn } from "@/lib/utils";
import { withUtm } from "@/lib/external-link";

const PLACEHOLDER_BRANDS = ["GitHub", "Stripe", "Figma", "Docker", "AWS Lambda", "Azure Functions", "BigQuery", "Vercel", "React", "Tailwind CSS"];

function SubmitButton() {
  return (
    <Link href="/submit" className="group/submit relative" aria-label="Submit an icon">
      <span className="relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-b from-orange-400 to-orange-600 px-3 text-xs font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:from-orange-400 hover:to-orange-500 hover:shadow-[0_3px_12px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.97] active:shadow-[0_0px_1px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.1)] sm:h-8 sm:px-3.5">
        {/* Shimmer */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover/submit:translate-x-full" />
        <Plus className="relative h-4 w-4 transition-transform duration-200 group-hover/submit:rotate-90 sm:h-3.5 sm:w-3.5" />
        <span className="relative hidden sm:inline">Submit Icon</span>
      </span>
    </Link>
  );
}

/**
 * Fire-and-forget GA4 `search` event. Feeds GA4's built-in Search Terms
 * report so non-PostHog stakeholders can see top queries without setup.
 * Safe to call before gtag loads — silently no-ops when window.gtag is
 * undefined (e.g. SSR, ad-blocker, dev without GA configured).
 */
function gaSearch(query: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (cmd: string, event: string, params: Record<string, unknown>) => void;
  };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", "search", { search_term: query });
}

const FIGMA_BADGE_EXPIRES_AT = Date.UTC(2026, 5, 3);

export function Header() {
  const { theme, setTheme } = useTheme();
  const defaultCopyFormat = useSettingsStore((s) => s.defaultCopyFormat);
  const setDefaultCopyFormat = useSettingsStore((s) => s.setDefaultCopyFormat);
  const showFigmaBadge = useSyncExternalStore(
    () => () => {},
    () => Date.now() < FIGMA_BADGE_EXPIRES_AT,
    () => true,
  );
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const recentSearches = useRecentsStore((s) => s.searched);
  const recentViewed = useRecentsStore((s) => s.viewed);
  const recordSearch = useRecentsStore((s) => s.recordSearch);
  const clearViewed = useRecentsStore((s) => s.clearViewed);
  const clearSearched = useRecentsStore((s) => s.clearSearched);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // React useId gives us SSR-safe, collision-free ARIA ids. Hardcoded
  // strings break if the Header ever renders twice (e.g. a mobile sheet
  // mirror) and confuse screen readers when ids overlap.
  const listboxId = useId();
  const activeOptionId = useId();
  const isMac = useSyncExternalStore(
    () => () => {},
    () => navigator.userAgent.includes("Mac"),
    () => false,
  );
  const prefersReducedMotion = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  // Live per-collection counts (icons.json is the source of truth), so the
  // quick-access list below never drifts out of sync the way hardcoded
  // counts did.
  const collectionCounts = useMemo(() => getCollections(), []);

  const activeCollection =
    searchParams.get("collection") ||
    (pathname.startsWith("/collection/") ? pathname.split("/")[2] : null);

  // Typewriter placeholder effect
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (query || focused || prefersReducedMotion) return;
    const brand = PLACEHOLDER_BRANDS[placeholderIdx];
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIdx < brand.length) {
          setCharIdx(charIdx + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (charIdx > 0) {
          setCharIdx(charIdx - 1);
        } else {
          setIsDeleting(false);
          setPlaceholderIdx((placeholderIdx + 1) % PLACEHOLDER_BRANDS.length);
        }
      }
    }, isDeleting ? 40 : 80);
    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, placeholderIdx, query, focused, prefersReducedMotion]);

  const dynamicPlaceholder = query || focused
    ? "Search icons..."
    : prefersReducedMotion
      ? `Search "${PLACEHOLDER_BRANDS[0]}"`
      : `Search "${PLACEHOLDER_BRANDS[placeholderIdx].slice(0, charIdx)}"`;

  const isHome = pathname === "/";

  const [suggestions, setSuggestions] = useState<IconEntry[]>([]);
  const [recentViewedIcons, setRecentViewedIcons] = useState<IconEntry[]>([]);
  const hasQuery = query.trim().length >= 2;
  const showDropdown = focused && (hasQuery ? suggestions.length > 0 : true);

  // Persist real search intent to recents after the user pauses typing,
  // and fire the same debounce point to PostHog + GA so analytics show
  // what's actually searched (autocapture never records typed input).
  // 700ms matches the landing page debounce — long enough to skip throwaway
  // keystrokes, short enough to capture intent before navigation.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const id = window.setTimeout(() => {
      recordSearch(q);
      posthog.capture("icon_searched", {
        query: q,
        query_length: q.length,
        source: "header",
      });
      gaSearch(q);
    }, 700);
    return () => window.clearTimeout(id);
  }, [query, recordSearch]);

  // Resolve recently viewed slugs to IconEntry on first focus so we can
  // render thumbnails in the dropdown. Manifest is the same one loaded
  // when typing, so a returning visitor often gets it from cache.
  useEffect(() => {
    if (!focused || recentViewed.length === 0) return;
    let active = true;
    loadIconsManifest()
      .then((icons) => {
        if (!active) return;
        const bySlug = new Map(icons.map((i) => [i.slug, i]));
        const resolved = recentViewed
          .map((r) => bySlug.get(r.slug))
          .filter((i): i is IconEntry => Boolean(i));
        setRecentViewedIcons(resolved);
      })
      .catch(() => {
        // Manifest failure is non-fatal — recents simply won't render
      });
    return () => {
      active = false;
    };
  }, [focused, recentViewed]);

  const hasRecents = recentViewedIcons.length > 0 || recentSearches.length > 0;

  // Functional updates so empty-query renders bail on Object.is.
  useEffect(() => {
    if (!hasQuery) {
      setSuggestions((prev) => (prev.length === 0 ? prev : []));
      setSelectedIdx((prev) => (prev === -1 ? prev : -1));
      return;
    }
    let active = true;
    Promise.all([loadIconsManifest(), import("@/lib/search")]).then(([icons, { searchIcons }]) => {
      if (!active) return;
      setSuggestions(searchIcons(icons, query).slice(0, 6));
      setSelectedIdx(-1);
    }).catch(() => {
      if (active) setSuggestions((prev) => (prev.length === 0 ? prev : []));
    });
    return () => { active = false; };
  }, [query, hasQuery]);

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
    <header
      className="sticky top-[var(--banner-h,0px)] z-50 hidden w-full px-2 pt-2 pb-0 sm:px-3 sm:pt-2.5 lg:block"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto max-w-[1800px] rounded-2xl border border-black/[0.06] bg-background/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-black/60 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]">
        {/* On mobile (<sm) the row wraps and the search drops to a second
            row using `order-last`, so phones like Realme/iPhone SE get a
            true full-width input instead of being squeezed between Submit
            and the icon cluster. On sm+ the layout returns to one row with
            the search as `flex-1`. */}
        <div className="flex flex-wrap items-center gap-2 px-2.5 py-2 sm:h-12 sm:flex-nowrap sm:gap-3 sm:py-0 sm:px-4">
          {/* Left: menu + logo */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 md:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/" className="group/logo flex items-center gap-1.5 text-foreground" aria-label="theSVG home">
              <TheSVGMark className="h-9 w-9 rounded-lg transition-transform duration-200 group-hover/logo:scale-105" />
              <span className="hidden text-[15px] font-bold tracking-tight text-foreground sm:inline">
                the<span className="text-orange-500">SVG</span>
              </span>
            </Link>
          </div>

          {/* Collection switcher */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Icon collections">
            {COLLECTIONS_LIST.map((meta) => {
              const href = meta.id === "brands" ? "/" : `/collection/${meta.id}`;
              const isActive = meta.id === "brands" ? !activeCollection : activeCollection === meta.id;
              const Icon = meta.icon;
              return (
                <Link
                  key={meta.id}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? meta.color : "opacity-60")} />
                  {meta.shortLabel}
                </Link>
              );
            })}
          </nav>

          {/* Center: search with dropdown. On mobile the form takes the
              full row (`order-last w-full`) so the input is never narrower
              than ~310px on a 360px device. On sm+ it reverts to `flex-1`
              with the historical `max-w-xl` centering. */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative order-last w-full basis-full sm:order-none sm:w-auto sm:flex-1 sm:basis-auto"
          >
            <div className="relative w-full sm:mx-auto sm:max-w-2xl">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onKeyDown={handleKeyNav}
                placeholder={dynamicPlaceholder}
                /* text-base (16px) on mobile prevents iOS auto-zoom on
                   focus; sm+ keeps the historical 14px. */
                className="h-11 w-full rounded-xl border border-border bg-muted/40 pr-12 pl-9 text-base shadow-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:bg-background focus:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] focus:ring-1 focus:ring-ring/30 sm:h-9 sm:pr-16 sm:text-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:focus:border-white/[0.15] dark:focus:bg-white/[0.06] dark:focus:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)]"
                aria-label="Search icons"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  hasQuery && selectedIdx >= 0
                    ? `${activeOptionId}-${selectedIdx}`
                    : undefined
                }
                maxLength={100}
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

            {/* Search dropdown - spans the input on mobile, capped at the
                input width (max-w-xl) on sm+. */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                id={listboxId}
                className="absolute top-full right-0 left-0 z-50 mt-1.5 min-w-[min(420px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border/60 bg-background shadow-[0_16px_48px_-12px_rgba(0,0,0,0.25),0_4px_12px_-4px_rgba(0,0,0,0.15)] sm:mx-auto sm:max-w-2xl dark:border-white/[0.12] dark:bg-[#0f0f10] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7),0_4px_12px_-4px_rgba(0,0,0,0.5)]"
                role="listbox"
              >
                {hasQuery ? (
                  /* Search results */
                  <div className="px-2 py-1.5">
                    <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                      Results
                    </p>
                    {suggestions.map((icon, i) => (
                      <button
                        key={icon.slug}
                        id={`${activeOptionId}-${i}`}
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
                ) : (
                  /* Quick links when focused with no query */
                  <div className="px-2 py-2">
                    {hasRecents && (
                      <>
                        <div className="flex items-center justify-between px-2 py-1">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                            Recent
                          </p>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              clearViewed();
                              clearSearched();
                              setRecentViewedIcons([]);
                            }}
                            className="text-[10px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                          >
                            Clear
                          </button>
                        </div>
                        {recentViewedIcons.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 px-2 pb-1.5">
                            {recentViewedIcons.slice(0, 8).map((icon) => (
                              <button
                                key={icon.slug}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  posthog.capture("recents_clicked", {
                                    kind: "viewed",
                                    slug: icon.slug,
                                    source: "header_dropdown",
                                  });
                                  navigateToIcon(icon.slug);
                                }}
                                className="group/recent flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-1.5 py-1 transition-all hover:border-foreground/20 hover:bg-accent dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.15]"
                                title={icon.title}
                                aria-label={`Open ${icon.title}`}
                              >
                                <img
                                  src={icon.variants.default}
                                  alt=""
                                  className="h-4 w-4 shrink-0 object-contain"
                                />
                                <span className="max-w-[88px] truncate text-[11px] text-muted-foreground transition-colors group-hover/recent:text-foreground">
                                  {icon.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {recentSearches.length > 0 && (
                          <div className="flex flex-wrap gap-1 px-2 pb-1.5">
                            {recentSearches.slice(0, 5).map((r) => (
                              <button
                                key={r.query}
                                type="button"
                                onMouseDown={(e) => {
                                  // mousedown so it fires before the input blur
                                  e.preventDefault();
                                  posthog.capture("recents_clicked", {
                                    kind: "searched",
                                    query: r.query,
                                    source: "header_dropdown",
                                  });
                                  setQuery(r.query);
                                  inputRef.current?.focus();
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-border/30 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-accent hover:text-foreground dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.15]"
                              >
                                <Search className="h-2.5 w-2.5" />
                                {r.query}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="my-1.5 h-px bg-border/30 dark:bg-white/[0.04]" />
                      </>
                    )}
                    <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                      Quick access
                    </p>
                    {COLLECTIONS_LIST.map((meta) => {
                      const count = collectionCounts.find((c) => c.name === meta.id)?.count ?? 0;
                      return (
                        <Link
                          key={meta.id}
                          href={`/collection/${meta.id}`}
                          onClick={() => setFocused(false)}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50"
                        >
                          <meta.icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
                          <span className="flex-1 text-sm font-medium text-foreground">{meta.label}</span>
                          <span className="text-[10px] text-muted-foreground/50">{count.toLocaleString()}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                        </Link>
                      );
                    })}

                    <div className="my-1.5 h-px bg-border/30 dark:bg-white/[0.04]" />

                    <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                      Pages
                    </p>
                    {[
                      { href: "/extensions", icon: Package, label: "Extensions & Integrations" },
                      { href: "/blog", icon: FileText, label: "Blog & Updates" },
                      { href: "/submit", icon: Sparkles, label: "Submit an Icon" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setFocused(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/50"
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="flex-1 text-xs text-muted-foreground hover:text-foreground">{item.label}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/20" />
                      </Link>
                    ))}

                    <div className="my-1.5 h-px bg-border/30 dark:bg-white/[0.04]" />

                    <p className="px-2 py-1 text-[10px] text-muted-foreground/40">
                      Try: &ldquo;lambda&rdquo; &ldquo;stripe&rdquo; &ldquo;compute&rdquo; &ldquo;react&rdquo;
                    </p>
                  </div>
                )}
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

          {/* Right: actions. On mobile we keep only Submit + GitHub +
              theme toggle so the top row stays slim and the search row
              below can claim the full width. */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:ml-0 sm:gap-1">
            <Link
              href="/extensions"
              className="hidden items-center rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
            >
              Extensions
            </Link>

            <SubmitButton />

            <div className="ml-1 flex items-center gap-0.5 sm:gap-1">
              <a
                href={withUtm("https://www.npmjs.com/package/thesvg", "header")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on npm"
                title="npm"
                className="hidden h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-all hover:border-[#cb3837]/30 hover:bg-[#cb3837]/5 hover:text-[#cb3837] sm:inline-flex dark:border-white/[0.06] dark:hover:border-[#cb3837]/30"
              >
                <img
                  src="/icons/npm/default.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                />
              </a>
              <a
                href={withUtm("https://www.raycast.com/thegdsks/thesvg", "header")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on Raycast"
                title="Raycast extension"
                className="hidden h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-all hover:border-[#FF6363]/30 hover:bg-[#FF6363]/5 hover:text-[#FF6363] sm:inline-flex dark:border-white/[0.06] dark:hover:border-[#FF6363]/30"
              >
                <img
                  src="/icons/raycast/default.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
              </a>
              <a
                href={withUtm("https://www.figma.com/community/plugin/1612997159050367763", "header")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={showFigmaBadge ? "Open the Figma plugin (new)" : "Open the Figma plugin"}
                title={showFigmaBadge ? "Figma plugin - new" : "Figma plugin"}
                className="relative hidden h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-all hover:border-[#F24E1E]/40 hover:bg-[#F24E1E]/5 hover:text-[#F24E1E] sm:inline-flex dark:border-white/[0.06] dark:hover:border-[#F24E1E]/40"
              >
                <img
                  src="/icons/figma/default.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                {showFigmaBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 flex h-2 w-2"
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500/60 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                  </span>
                )}
              </a>
              <a
                href={withUtm("https://marketplace.visualstudio.com/items?itemName=glincker.thesvg", "header")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Install the VS Code extension"
                title="VS Code extension"
                className="hidden h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-all hover:border-[#007ACC]/30 hover:bg-[#007ACC]/5 hover:text-[#007ACC] sm:inline-flex dark:border-white/[0.06] dark:hover:border-[#007ACC]/30"
              >
                <img
                  src="/icons/visual-studio-code/default.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
              </a>
              <a
                href={withUtm("https://github.com/GLINCKER/thesvg", "header")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
                title="GitHub repository"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-all hover:border-foreground/20 hover:bg-accent hover:text-foreground sm:h-8 sm:w-8 dark:border-white/[0.08] dark:hover:border-white/20 dark:hover:bg-white/[0.06]"
              >
                <Github className="h-4 w-4" />
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Default copy format"
                    title="Default Copy Format"
                  >
                    <span className="text-[10px] uppercase font-bold">{FORMAT_BUTTONS.find(f => f.value === defaultCopyFormat)?.label || defaultCopyFormat}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {FORMAT_BUTTONS.map((fmt) => (
                    <DropdownMenuItem
                      key={fmt.value}
                      onClick={() => setDefaultCopyFormat(fmt.value)}
                      className="flex items-center justify-between"
                    >
                      {fmt.label}
                      {defaultCopyFormat === fmt.value && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-8 sm:w-8"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
