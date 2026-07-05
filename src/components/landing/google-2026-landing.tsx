"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { IconEntry } from "@/lib/icons";
import { Google2026Tile } from "./google-2026-tile";
import {
  COLOR_BUCKETS,
  colorBucket,
  type ColorBucket,
} from "@/lib/color-bucket";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { cn } from "@/lib/utils";

interface Props {
  icons: IconEntry[];
}

const HERO_SLUG = "google-workspace";

function cleanTitle(t: string): string {
  return t.replace(/\s*\(2026\)\s*$/, "");
}

export function Google2026Landing({ icons }: Props) {
  const hero = icons.find((i) => i.slug === HERO_SLUG);
  const heroIcons = useMemo(
    () => icons.filter((i) => i.slug !== HERO_SLUG),
    [icons],
  );
  const [query, setQuery] = useState("");
  const [activeColors, setActiveColors] = useState<Set<ColorBucket>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  const recordSearch = useRecentsStore((s) => s.recordSearch);

  // Persist a search to recents after the user pauses typing for a moment.
  // 700ms debounce — long enough to skip transient keystrokes, short enough
  // to capture a real intent before they navigate away.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const id = window.setTimeout(() => recordSearch(q), 700);
    return () => window.clearTimeout(id);
  }, [query, recordSearch]);

  // Pre-compute which buckets are actually represented in this set so we
  // can grey out chips for buckets that would always produce zero results.
  const bucketCounts = useMemo(() => {
    const counts = new Map<ColorBucket, number>();
    for (const i of heroIcons) {
      const b = colorBucket(i.hex);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return counts;
  }, [heroIcons]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const colors = activeColors;
    return heroIcons.filter((i) => {
      if (colors.size > 0 && !colors.has(colorBucket(i.hex))) return false;
      if (!q) return true;
      const hay = [
        i.title,
        i.slug,
        ...(i.aliases ?? []),
        ...(i.categories ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [heroIcons, query, activeColors]);

  function toggleColor(id: ColorBucket) {
    setActiveColors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearAllFilters() {
    setQuery("");
    setActiveColors(new Set());
  }

  const hasFilter = query.trim().length > 0 || activeColors.size > 0;

  useEffect(() => {
    const root = gridRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      root.querySelectorAll<HTMLElement>(".g26-tile").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    root.querySelectorAll(".g26-tile").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filtered]);

  // Keyboard shortcut: "/" focuses the filter input — matches the
  // search-input convention used across the rest of the app.
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="g26-root">
      {/* Skip link for keyboard users */}
      <a href="#g26-grid" className="g26-skip">Skip to icons</a>

      <section className="g26-hero" aria-labelledby="g26-title">
        <span className="g26-hero-drift" aria-hidden />
        <span className="g26-hero-grain" aria-hidden />

        <div className="g26-hero-left">
          <div className="g26-eyebrow">
            <span className="g26-eyebrow-dot" aria-hidden />
            <span>Google · 2026 refresh</span>
          </div>

          <h1 id="g26-title" className="g26-title">
            <span className="g26-title-line">The Workspace</span>
            <span className="g26-title-line g26-title-accent">brand kit</span>
          </h1>

          <div className="g26-meta">
            <span className="g26-meta-item">
              <strong>{icons.length}</strong>
              <span>icons</span>
            </span>
            <span className="g26-meta-divider" aria-hidden />
            <span className="g26-meta-item">
              <strong>SVG</strong>
              <span>gradient-perfect</span>
            </span>
            <span className="g26-meta-divider" aria-hidden />
            <span className="g26-meta-item">
              <strong>Q2 · 2026</strong>
              <span>released</span>
            </span>
          </div>
        </div>

        {hero ? (
          <Link
            href={`/icon/${hero.slug}`}
            className="g26-hero-mark"
            aria-label="Google Workspace mark · open detail page"
          >
            { }
            <img
              src={hero.variants.default}
              alt=""
              loading="eager"
              decoding="async"
            />
            <span className="g26-hero-mark-cta" aria-hidden>
              Open <ArrowUpRight className="h-3 w-3" />
            </span>
          </Link>
        ) : null}
      </section>

      <section
        className="g26-grid-section"
        aria-labelledby="g26-grid-heading"
      >
        <div className="g26-grid-header">
          <div className="g26-grid-header-text">
            <h2 id="g26-grid-heading">The full set</h2>
            <p className="g26-grid-count">
              {filtered.length} of {heroIcons.length} icons
            </p>
          </div>

          <div className="g26-grid-controls">
            <div className="g26-search">
              <Search className="g26-search-icon" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                placeholder="Filter (Gmail, Drive, blue…)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Filter Google 2026 icons"
                className="g26-search-input"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="g26-search-clear"
                  aria-label="Clear filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="g26-search-kbd" aria-hidden>
                  /
                </kbd>
              )}
            </div>

            <Link href="/category/google" className="g26-grid-link">
              <span>All Google icons</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="g26-chips" role="group" aria-label="Filter by brand color">
          {COLOR_BUCKETS.map((b) => {
            const count = bucketCounts.get(b.id) ?? 0;
            const active = activeColors.has(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleColor(b.id)}
                disabled={count === 0}
                aria-pressed={active}
                className={cn("g26-chip", active && "is-active")}
                title={
                  count === 0
                    ? `No ${b.label.toLowerCase()} icons in this set`
                    : `${count} ${b.label.toLowerCase()} icon${count === 1 ? "" : "s"}`
                }
              >
                <span
                  className="g26-chip-dot"
                  style={{ backgroundColor: b.hex }}
                  aria-hidden
                />
                <span>{b.label}</span>
                <span className="g26-chip-count" aria-hidden>
                  {count}
                </span>
              </button>
            );
          })}
          {hasFilter && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="g26-chip g26-chip-clear"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div
            id="g26-grid"
            ref={gridRef}
            className="g26-grid"
            role="list"
            aria-label="Google 2026 brand icons"
          >
            {filtered.map((icon, idx) => (
              <Google2026Tile
                key={icon.slug}
                icon={icon}
                delay={Math.min(idx * 30, 360)}
                cleanTitle={cleanTitle}
              />
            ))}
          </div>
        ) : (
          <div className="g26-empty" role="status">
            <p>
              No icons match{" "}
              {query.trim() ? <strong>&ldquo;{query}&rdquo;</strong> : null}
              {query.trim() && activeColors.size > 0 ? " with " : null}
              {activeColors.size > 0 ? (
                <strong>
                  {[...activeColors].map((c) => COLOR_BUCKETS.find((b) => b.id === c)?.label).join(" + ")}
                </strong>
              ) : null}
              .
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="g26-grid-link"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
