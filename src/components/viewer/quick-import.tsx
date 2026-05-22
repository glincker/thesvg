"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadIconsManifest } from "@/lib/icons-manifest";
import type { IconEntry } from "@/lib/icons";

interface QuickImportProps {
  /** Receives raw SVG XML string and the icon's title (for export filename / pen title). */
  onImport: (svg: string, title: string) => void;
  className?: string;
}

const STARTER_SLUGS = [
  "gmail-2026",
  "google-drive-2026",
  "google-calendar-2026",
  "google-meet-2026",
  "github",
  "figma",
  "vercel",
  "stripe",
];

export function QuickImport({ onImport, className }: QuickImportProps) {
  const [icons, setIcons] = useState<IconEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadIconsManifest()
      .then((data) => {
        if (!cancelled) setIcons(data);
      })
      .catch(() => {
        if (!cancelled) setIcons([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const starterIcons = useMemo(() => {
    if (!icons) return [];
    const lookup = new Map(icons.map((i) => [i.slug, i]));
    return STARTER_SLUGS.map((s) => lookup.get(s)).filter(
      (x): x is IconEntry => Boolean(x),
    );
  }, [icons]);

  const matches = useMemo(() => {
    if (!icons || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const result: IconEntry[] = [];
    for (const icon of icons) {
      if (result.length >= 8) break;
      if (
        icon.slug.toLowerCase().includes(q) ||
        icon.title.toLowerCase().includes(q) ||
        icon.aliases.some((a) => a.toLowerCase().includes(q))
      ) {
        result.push(icon);
      }
    }
    return result;
  }, [icons, query]);

  const loadIcon = useCallback(
    async (icon: IconEntry) => {
      setLoadingSlug(icon.slug);
      try {
        const res = await fetch(icon.variants.default);
        if (!res.ok) {
          // Surface the failure so the viewer's status bar can flip to
          // "invalid" with a useful error instead of receiving the
          // origin's HTML error page as garbage SVG content.
          throw new Error(`Failed to load ${icon.slug} (${res.status})`);
        }
        const text = await res.text();
        onImport(text, icon.title);
        setOpen(false);
        setQuery("");
      } catch {
        // swallow; the viewer's error state will surface failures on its side.
      } finally {
        setLoadingSlug(null);
      }
    },
    [onImport],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!matches.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const pick = matches[activeIndex];
        if (pick) void loadIcon(pick);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [matches, activeIndex, loadIcon],
  );

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-2", className)}>
      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/30 px-3 py-2 focus-within:border-border focus-within:bg-card">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              icons === null
                ? "Loading icon library..."
                : "Import from library — try 'gmail 2026', 'github'..."
            }
            disabled={icons === null}
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50 disabled:cursor-wait"
          />
        </div>
        {open && matches.length > 0 && (
          <div className="absolute top-full z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-border/60 bg-popover shadow-lg">
            <ul role="listbox" className="max-h-72 overflow-auto py-1">
              {matches.map((icon, i) => (
                <li key={icon.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => loadIcon(icon)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-1.5 text-left text-xs transition-colors",
                      i === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground",
                    )}
                  >
                    <div className="icon-preview-bg flex h-7 w-7 shrink-0 items-center justify-center rounded-md p-1">
                      <img
                        src={icon.variants.default}
                        alt=""
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="flex-1 truncate">
                      <span className="font-medium">{icon.title}</span>
                      <span className="ml-2 font-mono text-[10px] text-muted-foreground/70">
                        {icon.slug}
                      </span>
                    </span>
                    {loadingSlug === icon.slug && (
                      <span className="h-3 w-3 animate-spin rounded-full border border-muted-foreground/30 border-t-foreground" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Starter chips */}
      {starterIcons.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
            <Sparkles className="h-3 w-3" />
            Try
          </span>
          {starterIcons.map((icon) => (
            <button
              key={icon.slug}
              type="button"
              onClick={() => loadIcon(icon)}
              disabled={loadingSlug !== null}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground disabled:opacity-50"
            >
              <img
                src={icon.variants.default}
                alt=""
                className="h-3 w-3 object-contain"
              />
              {icon.title.replace(" (2026)", "")}
              {icon.slug.endsWith("-2026") && (
                <span className="rounded-full bg-gradient-to-r from-fuchsia-500/90 via-orange-500/90 to-amber-400/90 px-1 py-0 font-mono text-[8px] font-semibold leading-tight tracking-wider text-white">
                  26
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
