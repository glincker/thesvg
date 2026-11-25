"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "@/components/own-icons";
import type { IconEntry } from "@/lib/icons";
import { Google2026Tile } from "./google-2026-tile";
import {
  COLOR_BUCKETS,
  COLOR_BUCKETS_BY_ID,
  colorBucket,
  type ColorBucket,
} from "@/lib/color-bucket";
import { useRecentsStore } from "@/lib/stores/recents-store";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/use-t";

interface Props {
  icons: IconEntry[];
}

const HERO_SLUG = "google-workspace";

function cleanTitle(t: string): string {
  return t.replace(/\s*\(2026\)\s*$/, "");
}

export function Google2026Landing({ icons }: Props) {
  const { t } = useT();
  const colorLabel = (id: ColorBucket): string => t(`home.google.colors.${id}`, { defaultValue: COLOR_BUCKETS_BY_ID.get(id)?.label ?? id });
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

  // Pre-calculate search strings and color buckets once per icon manifest update
  // to avoid redundant string allocations and hash lookups on every keystroke
  const processedHeroIcons = useMemo(() => {
    return heroIcons.map((i) => {
      const hay = [
        i.title,
        i.slug,
        ...(i.aliases ?? []),
        ...(i.categories ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return {
        icon: i,
        bucket: colorBucket(i.hex),
        searchString: hay,
      };
    });
  }, [heroIcons]);

  // Pre-compute which buckets are actually represented in this set so we
  // can grey out chips for buckets that would always produce zero results.
  const bucketCounts = useMemo(() => {
    const counts = new Map<ColorBucket, number>();
    for (let j = 0; j < processedHeroIcons.length; j++) {
      const b = processedHeroIcons[j].bucket;
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return counts;
  }, [processedHeroIcons]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasColors = activeColors.size > 0;
    const out: IconEntry[] = [];

    // Single-pass for loop avoiding redundant array allocations (.filter().map())
    for (let j = 0; j < processedHeroIcons.length; j++) {
      const pi = processedHeroIcons[j];
      if (hasColors && !activeColors.has(pi.bucket)) continue;
      if (!q || pi.searchString.includes(q)) out.push(pi.icon);
    }
    return out;
  }, [processedHeroIcons, query, activeColors]);

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
  const trimmedQuery = query.trim();
  const colorNames = [...activeColors].map(colorLabel).join(" + ");
  const noMatchText = trimmedQuery && colorNames
    ? t("home.google.noMatchBoth", { query: trimmedQuery, colors: colorNames })
    : trimmedQuery
      ? t("home.google.noMatchQuery", { query: trimmedQuery })
      : t("home.google.noMatchColors", { colors: colorNames });

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
      <a href="#g26-grid" className="g26-skip">{t("home.google.skip")}</a>

      <section className="g26-hero" aria-labelledby="g26-title">
        <span className="g26-hero-drift" aria-hidden />
        <span className="g26-hero-grain" aria-hidden />

        <div className="g26-hero-left">
          <div className="g26-eyebrow">
            <span className="g26-eyebrow-dot" aria-hidden />
            <span>{t("home.google.eyebrow")}</span>
          </div>

          <h1 id="g26-title" className="g26-title">
            <span className="g26-title-line">{t("home.google.titleLine1")}</span>
            <span className="g26-title-line g26-title-accent">{t("home.google.titleLine2")}</span>
          </h1>

          <div className="g26-meta">
            <span className="g26-meta-item">
              <strong>{icons.length}</strong>
              <span>{t("home.google.icons")}</span>
            </span>
            <span className="g26-meta-divider" aria-hidden />
            <span className="g26-meta-item">
              <strong>SVG</strong>
              <span>{t("home.google.gradientPerfect")}</span>
            </span>
            <span className="g26-meta-divider" aria-hidden />
            <span className="g26-meta-item">
              <strong>Q2 · 2026</strong>
              <span>{t("home.google.released")}</span>
            </span>
          </div>
        </div>

        {hero ? (
          <Link
            href={`/icon/${hero.slug}`}
            className="g26-hero-mark"
            aria-label={t("home.google.markAria")}
          >
            { }
            <img
              src={hero.variants.default}
              alt=""
              loading="eager"
              decoding="async"
            />
            <span className="g26-hero-mark-cta" aria-hidden>
              {t("home.google.open")} <ArrowUpRight className="h-3.5 w-3.5" />
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
            <h2 id="g26-grid-heading">{t("home.google.fullSet")}</h2>
            <p className="g26-grid-count">
              {t("home.google.countOf", { shown: filtered.length, total: heroIcons.length })}
            </p>
          </div>

          <div className="g26-grid-controls">
            <div className="g26-search">
              <Search className="g26-search-icon" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                placeholder={t("home.google.filterPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t("home.google.filterAria")}
                className="g26-search-input"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="g26-search-clear"
                  aria-label={t("home.google.clearFilter")}
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
              <span>{t("home.google.allGoogle")}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="g26-chips" role="group" aria-label={t("home.google.filterByColor")}>
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
                    ? t("home.google.noColorIcons", { color: colorLabel(b.id).toLowerCase() })
                    : t("home.google.colorIcons", { count, color: colorLabel(b.id).toLowerCase() })
                }
              >
                <span
                  className="g26-chip-dot"
                  style={{ backgroundColor: b.hex }}
                  aria-hidden
                />
                <span>{colorLabel(b.id)}</span>
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
              <X className="h-3.5 w-3.5" />
              <span>{t("home.clear")}</span>
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div
            id="g26-grid"
            ref={gridRef}
            className="g26-grid"
            role="list"
            aria-label={t("home.google.gridAria")}
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
              {noMatchText}
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="g26-grid-link"
            >
              {t("home.google.clearFilters")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
