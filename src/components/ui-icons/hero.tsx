"use client";

import { UiGlyph } from "@/components/ui-glyph";
import { useEffect, useRef, useState } from "react";
import { GLYPHS, GLYPH_BY_SLUG, VARIANTS } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { Glyph } from "./glyph";
import { useUi } from "./ui-state";

const SHOWCASE = ["shield-check", "rocket", "bell-ring"] as const;
const ROW = 22;

/** Two slow rows of icons behind the headline. Cheap looks only (no filters), duplicated so the loop is seamless. */
function Marquee() {
  const ui = useUi();
  const pool = GLYPHS.filter((g) => g.released || g.setId !== "backlog");
  const rows = [pool.slice(0, ROW)];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-center overflow-hidden border-t border-foreground/[0.05] opacity-[0.3] [mask-image:linear-gradient(to_right,transparent,#000_14%,#000_86%,transparent)]">
      {rows.map((row, i) => (
        <div key={i} className={cn("marquee-track flex w-max gap-6", i === 1 && "reverse")}>
          {[...row, ...row].map((g, j) => (
            <Glyph key={`${g.slug}-${j}`} nodes={g.nodes} variant={ui.variant === "glass" || ui.variant === "depth" ? "duotone" : ui.variant} size={28} className="text-foreground" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A look tile with a spotlight that follows the pointer, and an animated border while selected. */
function LookTile(props: { look: (typeof VARIANTS)[number]; active: boolean; onPick: () => void }) {
  const ui = useUi();
  const el = useRef<HTMLButtonElement>(null);
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = el.current?.getBoundingClientRect();
    if (!r || !el.current) return;
    el.current.style.setProperty("--tx", `${e.clientX - r.left}px`);
    el.current.style.setProperty("--ty", `${e.clientY - r.top}px`);
  };
  return (
    <button
      ref={el}
      type="button"
      onClick={props.onPick}
      onPointerMove={move}
      className="group/tile relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border bg-card/50 px-1 pb-2 pt-4 backdrop-blur-sm transition-colors hover:border-foreground/25"
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 [background:radial-gradient(110px_circle_at_var(--tx,50%)_var(--ty,0%),rgba(255,255,255,0.1),transparent_70%)] group-hover/tile:opacity-100" />
      {props.active && <span className="conic-border pointer-events-none absolute inset-0 rounded-2xl border-[1.5px] border-transparent" />}
      <div className="relative flex flex-col items-center gap-3">
        {SHOWCASE.map((slug) => {
          const g = GLYPH_BY_SLUG.get(slug);
          return g ? <Glyph key={slug} nodes={g.nodes} variant={props.look} size={38} accent={ui.accent} className="text-foreground" /> : null;
        })}
      </div>
      <span className={cn("relative text-[0.75rem] capitalize", props.active ? "text-foreground" : "text-muted-foreground")}>{props.look}</span>
    </button>
  );
}

export function Hero() {
  const ui = useUi();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem("svg-icons-hero") === "0");
    } catch {
      setHidden(false);
    }
  }, []);
  const hide = (v: boolean) => {
    setHidden(v);
    try {
      window.localStorage.setItem("svg-icons-hero", v ? "0" : "1");
    } catch {
      /* storage can be blocked, the hero then comes back on reload */
    }
  };
  if (hidden) {
    return (
      <button type="button" onClick={() => hide(false)} className="glass flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground">
        <UiGlyph name="sparkles" className="size-4 text-orange-400" /> One skeleton, every look <span className="ml-auto">Show intro</span>
      </button>
    );
  }
  return (
    <section className="relative overflow-hidden rounded-3xl border p-6 pb-16 [background:radial-gradient(70%_90%_at_12%_0%,color-mix(in_oklab,var(--glow,#f97316)_14%,transparent),transparent_70%),radial-gradient(60%_80%_at_100%_100%,rgba(56,189,248,0.07),transparent_70%),var(--background)] md:p-8 md:pb-16">
      <Marquee />
      <button type="button" aria-label="Hide intro" onClick={() => hide(true)} className="absolute right-3 top-3 z-10 grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
        <UiGlyph name="x" className="size-4" />
      </button>
      <div className="relative grid items-center gap-6 xl:grid-cols-[minmax(0,26rem)_1fr]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
            <UiGlyph name="sparkles" className="size-4" /> New in 4.0: UI icons
          </span>
          <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight md:text-3xl">One skeleton, every look</h1>
          <p className="mt-2 text-sm text-muted-foreground">Drawn on a grid, restyled live. Outline, duotone, fill, glass and glass outline, all themeable with currentColor.</p>
          <a href="#browse" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background">
            Browse icons <UiGlyph name="arrow-right" className="size-5" />
          </a>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {VARIANTS.map((v) => (
            <LookTile key={v} look={v} active={ui.variant === v} onPick={() => ui.setVariant(v)} />
          ))}
        </div>
      </div>
    </section>
  );
}
