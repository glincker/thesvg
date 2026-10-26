"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { GLYPHS, VIEW_SETS } from "@/lib/ui-icons/glyphs";
import { Glyph } from "./glyph";
import { useUi } from "./ui-state";

/** Every drop, newest first. The list is exactly what is out, so the numbers are always true. */
export function Changelog() {
  const ui = useUi();
  const released = VIEW_SETS.filter((s) => s.released).sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  const total = released.reduce((n, s) => n + s.count, 0);
  const upcoming = VIEW_SETS.filter((s) => !s.released && s.releaseDate && s.id !== "backlog");
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">What is new</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} UI icons released so far, with more added in small drops.</p>
      </header>
      {released.map((s) => {
        const items = GLYPHS.filter((g) => g.setId === s.id);
        return (
          <section key={s.id} className="rounded-3xl border bg-card/50 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <span className="rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground">{s.count} icons</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{s.releaseDate}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
              {items.map((g) => (
                <Link key={g.slug} href={`/ui/${g.slug}`} title={g.slug} className="flex flex-col items-center gap-1.5 rounded-2xl border bg-background/40 p-2.5 transition-colors hover:border-foreground/25">
                  <Glyph nodes={g.nodes} variant={ui.variant} size={30} accent={ui.accent} className="text-foreground" />
                  <span className="w-full truncate text-center text-[9px] text-muted-foreground">{g.slug}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {upcoming.length > 0 && (
        <p className="text-xs text-muted-foreground">Preview only: {upcoming.length} more drops are scheduled, {upcoming.reduce((n, s) => n + s.count, 0)} icons.</p>
      )}
    </div>
  );
}
