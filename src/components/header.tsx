"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Cloud, FileText, Github, Menu, Moon, Package, Plus, Search, Shapes, Sparkles, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useSearchStore } from "@/lib/stores/search-store";
import type { IconEntry } from "@/lib/icons";
import { loadIconsManifest } from "@/lib/icons-manifest";
import { cn } from "@/lib/utils";

/** Inline AWS logo - text inherits currentColor, arrow stays orange */
function AwsLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className}>
      <path d="M6.763 11.212c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 01-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 01-.287-.375 6.18 6.18 0 01-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.39-.384-.59-.894-.59-1.533 0-.678.24-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.4 2.4 0 01-.28.104.488.488 0 01-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 01.224-.167 4.577 4.577 0 011.005-.36 4.84 4.84 0 011.246-.151c.95 0 1.644.216 2.091.647.44.43.662 1.085.662 1.963v2.586h.016zm-3.24 1.214c.263 0 .534-.048.822-.144a1.78 1.78 0 00.758-.51 1.27 1.27 0 00.272-.512c.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 00-.735-.136 6.02 6.02 0 00-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 6.726a1.398 1.398 0 01-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 01.32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 01.311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 01-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 01-.303.08h-.687c-.15 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32L12.32 7.747l-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08l-.686.001zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 01-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.32.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 00.415-.758.777.777 0 00-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 01-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .36.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 01.24.2.43.43 0 01.071.263v.375c0 .168-.064.256-.184.256a.83.83 0 01-.303-.096 3.652 3.652 0 00-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.16.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926a2.157 2.157 0 01-.583.703c-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167z" />
      <path d="M.378 15.475c3.384 1.963 7.56 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.44-.2.814.287.383.607-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351zm23.531-.2c.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151l.175-.439c.343-.88.802-2.198.52-2.555-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399z" fill="#F90" />
    </svg>
  );
}

function AzureLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className={className}>
      <defs>
        <linearGradient id="az-a" x1="42.83" x2="15.79" y1="12.69" y2="92.57" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#114a8b" />
          <stop offset="1" stopColor="#0669bc" />
        </linearGradient>
        <linearGradient id="az-c" x1="47.84" x2="77.52" y1="10.36" y2="89.44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3ccbf4" />
          <stop offset="1" stopColor="#2892df" />
        </linearGradient>
      </defs>
      <path fill="url(#az-a)" d="M33.34 6.54h26.04l-27.03 80.1a4.15 4.15 0 0 1-3.94 2.81H8.15a4.14 4.14 0 0 1-3.93-5.47L29.4 9.38a4.15 4.15 0 0 1 3.94-2.83z" />
      <path fill="#0078d4" d="M71.17 60.26H29.88a1.91 1.91 0 0 0-1.3 3.31l26.53 24.76a4.17 4.17 0 0 0 2.85 1.13h23.38z" />
      <path fill="url(#az-c)" d="M66.6 9.36a4.14 4.14 0 0 0-3.93-2.82H33.65a4.15 4.15 0 0 1 3.93 2.82l25.18 74.62a4.15 4.15 0 0 1-3.93 5.48h29.02a4.15 4.15 0 0 0 3.93-5.48z" />
    </svg>
  );
}

function GcpLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className={className}>
      <path fill="#EA4335" d="M10.313 5.376l1.887-1.5-.332-.414a5.935 5.935 0 00-5.586-1.217 5.89 5.89 0 00-3.978 4.084c-.03.113.312-.098.463-.056l2.608-.428s.127-.124.201-.205c1.16-1.266 3.126-1.432 4.465-.354l.272.09z" />
      <path fill="#4285F4" d="M13.637 6.3a5.835 5.835 0 00-1.77-2.838l-1.83 1.82a3.226 3.226 0 011.193 2.564v.323c.9 0 1.63.725 1.63 1.62 0 .893-.73 1.619-1.63 1.619l-3.257-.003-.325.035v2.507l.325.053h3.257a4.234 4.234 0 004.08-2.962A4.199 4.199 0 0013.636 6.3z" />
      <path fill="#34A853" d="M4.711 13.999H7.97v-2.594H4.71c-.232 0-.461-.066-.672-.161l-.458.14-1.313 1.297-.114.447a4.254 4.254 0 002.557.87z" />
      <path fill="#FBBC05" d="M4.711 5.572A4.234 4.234 0 00.721 8.44a4.206 4.206 0 001.433 4.688l1.89-1.884a1.617 1.617 0 01.44-3.079 1.63 1.63 0 011.714.936l1.89-1.878A4.24 4.24 0 004.71 5.572z" />
    </svg>
  );
}

function SubmitButton() {
  return (
    <Link href="/submit" className="group/submit relative">
      <span className="relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-b from-orange-400 to-orange-600 px-3.5 text-xs font-semibold text-white shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:from-orange-400 hover:to-orange-500 hover:shadow-[0_3px_12px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.97] active:shadow-[0_0px_1px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.1)]">
        {/* Shimmer */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover/submit:translate-x-full" />
        <Plus className="relative h-3.5 w-3.5 transition-transform duration-200 group-hover/submit:rotate-90" />
        <span className="relative hidden sm:inline">Submit Icon</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  const activeCollection =
    searchParams.get("collection") ||
    (pathname.startsWith("/collection/") ? pathname.split("/")[2] : null);

  // Typewriter placeholder effect
  const PLACEHOLDER_BRANDS = ["GitHub", "Stripe", "Figma", "Docker", "AWS Lambda", "Azure Functions", "BigQuery", "Vercel", "React", "Tailwind CSS"];
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
  const hasQuery = query.trim().length >= 2;
  const showDropdown = focused && (hasQuery ? suggestions.length > 0 : true);

  // Lazy-load the manifest and Fuse.js when the user types a search query
  useEffect(() => {
    if (!hasQuery) {
      setSuggestions([]);
      setSelectedIdx(-1);
      return;
    }
    let active = true;
    Promise.all([loadIconsManifest(), import("@/lib/search")]).then(([icons, { searchIcons }]) => {
      if (!active) return;
      setSuggestions(searchIcons(icons, query).slice(0, 6));
      setSelectedIdx(-1);
    }).catch(() => {
      if (active) setSuggestions([]);
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

          {/* Collection switcher */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Icon collections">
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                !activeCollection
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={!activeCollection ? "page" : undefined}
            >
              <Shapes className="h-3 w-3" />
              Brands
            </Link>
            <Link
              href="/collection/aws"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                activeCollection === "aws"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={activeCollection === "aws" ? "page" : undefined}
            >
              <AwsLogo className="h-4 w-4" />
              AWS
            </Link>
            <Link
              href="/collection/gcp"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                activeCollection === "gcp"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={activeCollection === "gcp" ? "page" : undefined}
            >
              <GcpLogo className="h-4 w-4" />
              GCP
            </Link>
            <Link
              href="/collection/azure"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                activeCollection === "azure"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={activeCollection === "azure" ? "page" : undefined}
            >
              <AzureLogo className="h-4 w-4" />
              Azure
            </Link>
          </nav>

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
                placeholder={dynamicPlaceholder}
                className="h-9 w-full rounded-xl border border-border bg-muted/40 pr-16 pl-9 text-sm shadow-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:bg-background focus:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] focus:ring-1 focus:ring-ring/30 dark:border-white/[0.08] dark:bg-white/[0.04] dark:focus:border-white/[0.15] dark:focus:bg-white/[0.06] dark:focus:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)]"
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

            {/* Search dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                id="header-search-listbox"
                className="absolute top-full right-0 left-0 z-50 mx-auto mt-1.5 max-w-xl overflow-hidden rounded-xl border border-border/40 bg-background/95 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.1] dark:bg-[rgba(10,10,10,0.95)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.6)]"
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
                    <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                      Quick access
                    </p>
                    {[
                      { href: "/collection/brands", icon: Shapes, label: "Brand Icons", count: "4,019", color: "text-orange-500" },
                      { href: "/collection/aws", icon: Cloud, label: "AWS Architecture", count: "739", color: "text-[#ff9900]" },
                      { href: "/collection/azure", icon: Cloud, label: "Azure Services", count: "626", color: "text-[#0078d4]" },
                      { href: "/collection/gcp", icon: Cloud, label: "Google Cloud", count: "214", color: "text-[#4285f4]" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setFocused(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/50"
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                        <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground/50">{item.count}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                      </Link>
                    ))}

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

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/extensions"
              className="hidden items-center rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
            >
              Extensions
            </Link>

            <SubmitButton />

            <div className="ml-1 flex items-center gap-1">
              <a
                href="https://www.npmjs.com/package/thesvg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on npm"
                className="hidden items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-[#cb3837]/30 hover:bg-[#cb3837]/5 hover:text-[#cb3837] sm:inline-flex dark:border-white/[0.06] dark:hover:border-[#cb3837]/30"
              >
                <img
                  src="/icons/npm/default.svg"
                  alt="npm"
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                />
                <span className="hidden lg:inline">npm</span>
              </a>
              <a
                href="https://www.raycast.com/thegdsks/thesvg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on Raycast"
                className="hidden items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-[#FF6363]/30 hover:bg-[#FF6363]/5 hover:text-[#FF6363] sm:inline-flex dark:border-white/[0.06] dark:hover:border-[#FF6363]/30"
              >
                <img
                  src="/icons/raycast/default.svg"
                  alt="Raycast"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                <span className="hidden lg:inline">Raycast</span>
              </a>
              <a
                href="https://marketplace.visualstudio.com/items?itemName=glincker.thesvg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Install the VS Code extension"
                className="hidden items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-[#007ACC]/30 hover:bg-[#007ACC]/5 hover:text-[#007ACC] sm:inline-flex dark:border-white/[0.06] dark:hover:border-[#007ACC]/30"
              >
                <img
                  src="/icons/visual-studio-code/default.svg"
                  alt="VS Code"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                <span className="hidden lg:inline">VS Code</span>
              </a>
              <a
                href="https://github.com/GLINCKER/thesvg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/20 hover:bg-accent hover:text-foreground dark:border-white/[0.08] dark:hover:border-white/20 dark:hover:bg-white/[0.06]"
              >
                <Github className="h-4 w-4" />
                <span className="hidden lg:inline">GitHub</span>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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
