"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Activity,
  Check,
  Clock,
  Copy,
  Download,
  Eye,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { IconEntry } from "@/lib/icons";
import { useRecentsStore } from "@/lib/stores/recents-store";

interface Props {
  allIcons: IconEntry[];
}

type TimeWindow = "all" | "today" | "week" | "month";

const WINDOWS: { id: TimeWindow; label: string; ms: number | null }[] = [
  { id: "all", label: "All time", ms: null },
  { id: "today", label: "Today", ms: 24 * 60 * 60 * 1000 },
  { id: "week", label: "This week", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "month", label: "This month", ms: 30 * 24 * 60 * 60 * 1000 },
];

function timeAgo(ts: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function withinWindow(ts: number, win: TimeWindow): boolean {
  const def = WINDOWS.find((w) => w.id === win);
  if (!def || def.ms == null) return true;
  return Date.now() - ts <= def.ms;
}

export function RecentsPage({ allIcons }: Props) {
  const viewed = useRecentsStore((s) => s.viewed);
  const copied = useRecentsStore((s) => s.copied);
  const searched = useRecentsStore((s) => s.searched);
  const clearViewed = useRecentsStore((s) => s.clearViewed);
  const clearCopied = useRecentsStore((s) => s.clearCopied);
  const clearSearched = useRecentsStore((s) => s.clearSearched);
  const clearAll = useRecentsStore((s) => s.clearAll);
  const recordCopy = useRecentsStore((s) => s.recordCopy);

  const [hydrated, setHydrated] = useState(false);
  const [win, setWin] = useState<TimeWindow>("all");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => setHydrated(true), []);

  // Fade copy-confirmation pill.
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 1400);
    return () => window.clearTimeout(t);
  }, [flash]);

  const iconsBySlug = useMemo(
    () => new Map(allIcons.map((i) => [i.slug, i])),
    [allIcons],
  );

  const viewedIcons = useMemo(
    () =>
      viewed
        .map((v) => ({ entry: iconsBySlug.get(v.slug), ts: v.ts }))
        .filter((x): x is { entry: IconEntry; ts: number } => Boolean(x.entry))
        .filter((x) => withinWindow(x.ts, win)),
    [viewed, iconsBySlug, win],
  );

  const copiedIcons = useMemo(
    () =>
      copied
        .map((c) => ({
          entry: iconsBySlug.get(c.slug),
          ts: c.ts,
          format: c.format,
          count: c.count,
        }))
        .filter((x): x is {
          entry: IconEntry;
          ts: number;
          format: typeof copied[number]["format"];
          count: number;
        } => Boolean(x.entry))
        .filter((x) => withinWindow(x.ts, win)),
    [copied, iconsBySlug, win],
  );

  const filteredSearches = useMemo(
    () => searched.filter((s) => withinWindow(s.ts, win)),
    [searched, win],
  );

  const totalEntries =
    viewedIcons.length + copiedIcons.length + filteredSearches.length;
  const isEmpty = hydrated && totalEntries === 0;

  const handleCopyAgain = useCallback(
    async (entry: IconEntry, format: "svg" | "url") => {
      try {
        if (format === "svg") {
          const r = await fetch(entry.variants.default);
          const svg = await r.text();
          await navigator.clipboard.writeText(svg);
        } else {
          await navigator.clipboard.writeText(
            `https://thesvg.org${entry.variants.default}`,
          );
        }
        recordCopy(entry.slug, "svg");
        setFlash(`${entry.title} copied`);
        posthog.capture("recents_recopy", {
          slug: entry.slug,
          format,
          source: "recents_page",
        });
      } catch {
        setFlash("Copy failed");
      }
    },
    [recordCopy],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Flash pill */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2 transition-all duration-200 ${
          flash ? "opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-md">
          <Check className="h-4 w-4 text-emerald-500" />
          {flash}
        </div>
      </div>

      {/* Hero stats row */}
      <header className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          <span>Your activity, on this device only</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Recents
        </h1>

        {hydrated && (
          <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
            <StatCard
              icon={<Eye className="h-4 w-4" />}
              count={viewed.length}
              label="viewed"
              active={viewedIcons.length > 0}
            />
            <StatCard
              icon={<Copy className="h-4 w-4" />}
              count={copied.length}
              label="copied"
              active={copiedIcons.length > 0}
            />
            <StatCard
              icon={<Search className="h-4 w-4" />}
              count={searched.length}
              label="searched"
              active={filteredSearches.length > 0}
            />
          </div>
        )}

        {hydrated && totalEntries > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {WINDOWS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setWin(w.id)}
                aria-pressed={win === w.id}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  win === w.id
                    ? "border-foreground/40 bg-foreground text-background"
                    : "border-border/50 bg-card/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground dark:border-white/[0.06] dark:bg-white/[0.02]"
                }`}
              >
                {w.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear all recent activity?")) clearAll();
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive dark:border-white/[0.06]"
            >
              <Trash2 className="h-3 w-3" />
              Clear everything
            </button>
          </div>
        )}
      </header>

      {!hydrated && (
        <div className="flex justify-center py-24" role="status" aria-label="Loading your recents">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        </div>
      )}

      {isEmpty && (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/60 bg-gradient-to-br from-card/40 to-card/10 px-6 py-20 text-center dark:border-white/[0.08]">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.08),transparent_60%)]" />
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 ring-1 ring-inset ring-orange-500/20">
            <Sparkles className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Nothing here yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Browse a few icons and they will land here for one-tap recopy and quick reopen.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:opacity-90 active:scale-95"
          >
            Browse the library
          </Link>
        </div>
      )}

      {hydrated && totalEntries > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column: viewed (hero) */}
          <div className="space-y-6">
            {viewedIcons.length > 0 && (
              <Section
                title="Viewed"
                icon={<Eye className="h-3.5 w-3.5" />}
                count={viewedIcons.length}
                onClear={clearViewed}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {viewedIcons.map(({ entry, ts }) => (
                    <article
                      key={entry.slug}
                      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.15]"
                    >
                      <Link
                        href={`/icon/${entry.slug}`}
                        onClick={() =>
                          posthog.capture("recents_clicked", {
                            kind: "viewed",
                            slug: entry.slug,
                            source: "recents_page",
                          })
                        }
                        className="flex flex-col items-center gap-3 p-4"
                      >
                        <div className="flex h-16 w-16 items-center justify-center">
                          <img
                            src={entry.variants.default}
                            alt=""
                            className="h-14 w-14 object-contain transition-transform duration-200 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                        <div className="w-full text-center">
                          <p className="line-clamp-1 text-sm font-medium text-foreground">
                            {entry.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70">
                            {timeAgo(ts)} ago
                          </p>
                        </div>
                      </Link>
                      <div className="absolute inset-x-2 bottom-2 flex translate-y-2 items-center justify-center gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCopyAgain(entry, "svg");
                          }}
                          aria-label="Copy SVG"
                          title="Copy SVG"
                          className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-foreground/95 text-[11px] font-medium text-background backdrop-blur-sm transition-transform active:scale-95"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                        <a
                          href={entry.variants.default}
                          download={`${entry.slug}.svg`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Download"
                          title="Download"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/95 text-foreground backdrop-blur-sm transition-transform hover:bg-accent active:scale-95"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right column: copied + searches */}
          <aside className="space-y-6">
            {copiedIcons.length > 0 && (
              <Section
                title="Copied"
                icon={<Copy className="h-3.5 w-3.5" />}
                count={copiedIcons.length}
                onClear={clearCopied}
              >
                <ul className="overflow-hidden rounded-2xl border border-border/40 bg-card/40 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  {copiedIcons.map(({ entry, ts, format, count }, idx) => (
                    <li
                      key={`${entry.slug}-${format}`}
                      className={
                        idx !== 0
                          ? "border-t border-border/30 dark:border-white/[0.04]"
                          : ""
                      }
                    >
                      <div className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/30">
                        <Link
                          href={`/icon/${entry.slug}`}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <img
                            src={entry.variants.default}
                            alt=""
                            className="h-8 w-8 shrink-0 object-contain"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {entry.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              <span className="font-mono uppercase">{format}</span>
                              {count > 1 && (
                                <span> · {count}&times;</span>
                              )}
                              <span> · {timeAgo(ts)} ago</span>
                            </p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyAgain(entry, "svg")}
                          aria-label={`Copy ${entry.title} again`}
                          className="flex h-7 shrink-0 items-center gap-1 rounded-lg bg-foreground/90 px-2.5 text-[11px] font-medium text-background opacity-0 transition-all group-hover:opacity-100 active:scale-95"
                        >
                          <Copy className="h-3 w-3" />
                          Recopy
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {filteredSearches.length > 0 && (
              <Section
                title="Searches"
                icon={<Search className="h-3.5 w-3.5" />}
                count={filteredSearches.length}
                onClear={clearSearched}
              >
                <div className="flex flex-wrap gap-2">
                  {filteredSearches.map((r) => (
                    <Link
                      key={r.query}
                      href={`/?q=${encodeURIComponent(r.query)}`}
                      onClick={() =>
                        posthog.capture("recents_clicked", {
                          kind: "searched",
                          query: r.query,
                          source: "recents_page",
                        })
                      }
                      className="group inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 px-3 py-1.5 text-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.15]"
                    >
                      <Search className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-foreground" />
                      <span className="text-foreground">{r.query}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {timeAgo(r.ts)}
                      </span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  count,
  label,
  active,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-3 transition-colors sm:px-4 ${
        active
          ? "border-border/60 bg-card/70 dark:border-white/[0.1] dark:bg-white/[0.04]"
          : "border-border/40 bg-card/30 dark:border-white/[0.06] dark:bg-white/[0.02]"
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10.5px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
        {count}
      </p>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}

function Section({ title, icon, count, onClear, children }: SectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground dark:bg-white/[0.04]">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-muted/60 px-1.5 font-mono text-[10px] text-muted-foreground dark:bg-white/[0.04]">
          {count}
        </span>
        <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
        >
          <Clock className="h-3 w-3" />
          Clear
        </button>
      </div>
      {children}
    </section>
  );
}
