"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useMemo, useState, useEffect } from "react";
import { Clock, Copy, Eye, History, Search, Trash2 } from "lucide-react";
import type { IconEntry } from "@/lib/icons";
import { useRecentsStore } from "@/lib/stores/recents-store";

interface Props {
  allIcons: IconEntry[];
}

function timeAgo(ts: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function RecentsPage({ allIcons }: Props) {
  const viewed = useRecentsStore((s) => s.viewed);
  const copied = useRecentsStore((s) => s.copied);
  const searched = useRecentsStore((s) => s.searched);
  const clearViewed = useRecentsStore((s) => s.clearViewed);
  const clearCopied = useRecentsStore((s) => s.clearCopied);
  const clearSearched = useRecentsStore((s) => s.clearSearched);
  const clearAll = useRecentsStore((s) => s.clearAll);

  // localStorage is client-only — render an empty shell on first paint to
  // avoid hydration mismatch, then swap in the real content.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const iconsBySlug = useMemo(
    () => new Map(allIcons.map((i) => [i.slug, i])),
    [allIcons],
  );

  const viewedIcons = useMemo(
    () =>
      viewed
        .map((v) => ({ entry: iconsBySlug.get(v.slug), ts: v.ts }))
        .filter((x): x is { entry: IconEntry; ts: number } => Boolean(x.entry)),
    [viewed, iconsBySlug],
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
        } => Boolean(x.entry)),
    [copied, iconsBySlug],
  );

  const totalEntries = viewed.length + copied.length + searched.length;
  const isEmpty = hydrated && totalEntries === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/50 px-3 py-1 text-xs text-muted-foreground dark:border-white/[0.06] dark:bg-white/[0.02]">
          <History className="h-3 w-3" />
          <span>Stored locally in your browser</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Your recent activity
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Pick up where you left off. Nothing here leaves your device — clear it
          any time.
        </p>

        {hydrated && totalEntries > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted/60 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground dark:bg-white/[0.04]">
              {viewed.length} viewed
            </span>
            <span className="rounded-full bg-muted/60 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground dark:bg-white/[0.04]">
              {copied.length} copied
            </span>
            <span className="rounded-full bg-muted/60 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground dark:bg-white/[0.04]">
              {searched.length} searched
            </span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear all recent activity?")) clearAll();
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 dark:bg-white/[0.04]">
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Nothing here yet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse some icons and they&rsquo;ll show up here for quick access next time.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Browse the library
          </Link>
        </div>
      )}

      {hydrated && viewedIcons.length > 0 && (
        <Section
          title="Recently viewed"
          icon={<Eye className="h-3.5 w-3.5" />}
          count={viewedIcons.length}
          onClear={clearViewed}
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {viewedIcons.map(({ entry, ts }) => (
              <Link
                key={entry.slug}
                href={`/icon/${entry.slug}`}
                onClick={() =>
                  posthog.capture("recents_clicked", {
                    kind: "viewed",
                    slug: entry.slug,
                    source: "recents_page",
                  })
                }
                className="group flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card/60 p-3 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12]"
              >
                <img
                  src={entry.variants.default}
                  alt=""
                  className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-110"
                  loading="lazy"
                />
                <span className="line-clamp-1 w-full text-center text-xs font-medium text-foreground/90 group-hover:text-foreground">
                  {entry.title}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {timeAgo(ts)}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {hydrated && copiedIcons.length > 0 && (
        <Section
          title="Recently copied"
          icon={<Copy className="h-3.5 w-3.5" />}
          count={copiedIcons.length}
          onClear={clearCopied}
        >
          <ul className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/40 bg-card/40 dark:divide-white/[0.04] dark:border-white/[0.06] dark:bg-white/[0.02]">
            {copiedIcons.map(({ entry, ts, format, count }) => (
              <li key={`${entry.slug}-${format}`}>
                <Link
                  href={`/icon/${entry.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40"
                >
                  <img
                    src={entry.variants.default}
                    alt=""
                    className="h-7 w-7 shrink-0 object-contain"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Copied as <span className="font-mono uppercase">{format}</span>
                      {count > 1 && <span> · {count}&times;</span>}
                    </p>
                  </div>
                  <span className="hidden text-[11px] text-muted-foreground/60 sm:inline">
                    {timeAgo(ts)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hydrated && searched.length > 0 && (
        <Section
          title="Recent searches"
          icon={<Search className="h-3.5 w-3.5" />}
          count={searched.length}
          onClear={clearSearched}
        >
          <div className="flex flex-wrap gap-2">
            {searched.map((r) => (
              <Link
                key={r.query}
                href={`/?q=${encodeURIComponent(r.query)}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 px-3 py-1.5 text-sm text-foreground transition-all hover:border-foreground/20 hover:bg-accent dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.15]"
              >
                <Search className="h-3 w-3 text-muted-foreground" />
                <span>{r.query}</span>
                <span className="text-[10px] text-muted-foreground/60">
                  · {timeAgo(r.ts)}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}
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
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 text-muted-foreground dark:bg-white/[0.04]">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
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
