"use client";

import { UiGlyph } from "@/components/ui-glyph";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { ColorPicker } from "./color-picker";
import { Glyph } from "./glyph";
import { cn } from "@/lib/ui-icons/utils";
import { renderIcon, type IconNode, type StyleParams, type Variant } from "@/lib/ui-icons/engine";
import { COPY_HINT, COPY_LABEL, COPY_TARGETS } from "@/lib/ui-icons/copy-target";
import { defaultColorOf } from "@/lib/ui-icons/default-color";
import { GLYPH_BY_SLUG, styleFor } from "@/lib/ui-icons/glyphs";
import { useUi } from "./ui-state";

const SWATCHES = ["f5c542", "fb923c", "fb7185", "a78bfa", "38bdf8", "34d399"] as const;
const SWATCH_BG: Record<(typeof SWATCHES)[number], string> = {
  f5c542: "bg-[#f5c542]", fb923c: "bg-[#fb923c]", fb7185: "bg-[#fb7185]", a78bfa: "bg-[#a78bfa]", "38bdf8": "bg-[#38bdf8]", "34d399": "bg-[#34d399]",
};
const CORNERS = ["sharp", "chamfer", "round"] as const;
const MINE_KEY = "svg-icons-my-style";
const HINT_KEY = "svg-icons-style-hint";
const STYLE_QUERY = ["w", "sc", "cr", "rd", "sh", "ct", "accent"];
// Icons with a closed body, so corners, weight and shadow all show in the preview.
const PREVIEW = ["rocket", "shield-check", "bell", "folder", "heart", "social-github"];
const CHIP_ICON = "shield-check";

type Lab = Partial<StyleParams>;
interface Mine { lab: Lab; accent: string }

interface Preset { id: string; label: string; lab: Lab }
// Each preset is a complete shape choice, so applying one replaces the current tweaks instead of piling onto them.
const PRESETS: Preset[] = [
  { id: "house", label: "House", lab: {} },
  { id: "crisp", label: "Crisp", lab: { strokeWidth: 1.25, corner: "sharp", radius: 0, cutTerminals: true, shadow: 0 } },
  { id: "soft", label: "Soft", lab: { strokeWidth: 1.75, corner: "round", radius: 3.5, cutTerminals: false } },
  { id: "bold", label: "Bold", lab: { strokeWidth: 2.4, corner: "chamfer", radius: 2, cutTerminals: true } },
  { id: "hairline", label: "Hairline", lab: { strokeWidth: 1, corner: "round", radius: 3, cutTerminals: false } },
  { id: "float", label: "Float", lab: { strokeWidth: 1.75, corner: "round", radius: 3.5, shadow: 0.35 } },
];

function readMine(): Mine | null {
  try {
    const raw = window.localStorage.getItem(MINE_KEY);
    return raw ? (JSON.parse(raw) as Mine) : null;
  } catch {
    return null;
  }
}

/** The resolved style on screen: what the controls show, whether or not it was touched. */
function useEffective() {
  const ui = useUi();
  const base = styleFor(ui.variant);
  return {
    base,
    weight: ui.lab.strokeWidth ?? base.strokeWidth,
    scale: ui.lab.scale ?? base.scale,
    corner: ui.lab.corner ?? base.corner,
    radius: ui.lab.radius ?? base.radius,
    cut: ui.lab.cutTerminals ?? base.cutTerminals,
    shadow: ui.lab.shadow ?? base.shadow,
  };
}

const same = (a: number, b: number): boolean => Math.abs(a - b) < 0.001;

/** True when every setting the preset names already has that value on screen. */
function matches(lab: Lab, now: ReturnType<typeof useEffective>, touched: boolean): boolean {
  if (Object.keys(lab).length === 0) return !touched;
  return (
    (lab.strokeWidth === undefined || same(lab.strokeWidth, now.weight)) &&
    (lab.scale === undefined || same(lab.scale, now.scale)) &&
    (lab.corner === undefined || lab.corner === now.corner) &&
    (lab.radius === undefined || same(lab.radius, now.radius)) &&
    (lab.cutTerminals === undefined || lab.cutTerminals === now.cut) &&
    (lab.shadow === undefined || same(lab.shadow, now.shadow))
  );
}

/** One glyph drawn with a given style, independent of what is currently applied to the page. */
function MiniGlyph({ nodes, variant, lab, size }: { nodes: IconNode[]; variant: Variant; lab: Lab; size: number }) {
  const id = useId().replaceAll(/[^a-zA-Z0-9]/g, "");
  const svg = useMemo(
    () => renderIcon(nodes, { variant, style: { ...styleFor(variant, lab), accent: "" }, size, idPrefix: `mg${id}` }).svg,
    [nodes, variant, lab, size, id],
  );
  return <span aria-hidden="true" className="inline-flex" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Range(props: { label: string; value: number; base: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const moved = !same(props.value, props.base);
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="flex items-center justify-between text-[0.75rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {props.label}
          {moved && (
            <button
              type="button"
              aria-label={`Reset ${props.label}`}
              title={`Back to ${props.base}`}
              onClick={(e) => { e.preventDefault(); props.onChange(props.base); }}
              className="grid size-4 place-items-center rounded text-orange-500 transition-colors hover:bg-orange-500/10"
            >
              <UiGlyph name="rotate-ccw" className="size-3.5" />
            </button>
          )}
        </span>
        <span className={cn("rounded-md bg-muted px-1.5 py-px font-mono text-[0.75rem]", moved ? "text-orange-500" : "text-foreground")}>{props.value}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-orange-500"
      />
    </label>
  );
}

function Segmented<T extends string>(props: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={props.label} className="flex gap-0.5 rounded-lg border bg-muted/30 p-0.5">
      {props.options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={props.value === o}
          onClick={() => props.onChange(o)}
          className={cn("h-6 flex-1 rounded-md px-2.5 text-[0.75rem] capitalize text-muted-foreground transition-colors hover:text-foreground", props.value === o && "bg-foreground text-background hover:text-background")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[0.75rem] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/** Six icons drawn with the style you are building, so every slider has an immediate, visible effect. */
function PreviewStrip() {
  const ui = useUi();
  const items = PREVIEW.map((slug) => GLYPH_BY_SLUG.get(slug)).filter((g) => g !== undefined);
  return (
    <div aria-label="Your style, live" className="flex items-center gap-1 rounded-lg border bg-gradient-to-r from-orange-500/[0.08] to-violet-500/[0.06] px-2 py-1">
      {items.map((g) => (
        <span key={g.slug} className={ui.colorMode === "natural" && !ui.accent ? defaultColorOf(g.slug) || "text-foreground" : "text-foreground"}>
          <Glyph nodes={g.nodes} variant={ui.variant} size={22} accent={ui.accent} />
        </span>
      ))}
    </div>
  );
}

function Presets({ mine, onApplyMine }: { mine: Mine | null; onApplyMine: () => void }) {
  const ui = useUi();
  const now = useEffective();
  const touched = Object.keys(ui.lab).length > 0;
  const g = GLYPH_BY_SLUG.get(CHIP_ICON);
  if (!g) return null;
  const chip = "group inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[0.75rem] text-muted-foreground transition-colors hover:border-orange-500/40 hover:text-foreground";
  return (
    <div role="radiogroup" aria-label="Style presets" className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => {
        const active = matches(p.lab, now, touched);
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => { ui.resetLab(); if (Object.keys(p.lab).length) ui.setLab(p.lab); }}
            className={cn(chip, active && "border-orange-500/60 bg-orange-500/10 text-foreground")}
          >
            <MiniGlyph nodes={g.nodes} variant={ui.variant} lab={p.lab} size={18} />
            {p.label}
          </button>
        );
      })}
      {mine && (
        <button type="button" onClick={onApplyMine} className={cn(chip, "border-dashed")} title="Your saved style">
          <MiniGlyph nodes={g.nodes} variant={ui.variant} lab={mine.lab} size={18} />
          Mine
        </button>
      )}
    </div>
  );
}

/** What the style currently is, in words, so the collapsed bar says something useful. */
function useSummary(): { chips: string[]; changes: number } {
  const ui = useUi();
  const now = useEffective();
  const touched = Object.keys(ui.lab).length > 0;
  const preset = PRESETS.find((p) => Object.keys(p.lab).length > 0 && matches(p.lab, now, touched));
  const changes = Object.keys(ui.lab).length + (ui.accent ? 1 : 0) + (ui.colorMode === "mono" ? 1 : 0);
  return {
    chips: [preset?.label ?? `weight ${now.weight}`, ...(preset ? [] : [now.corner, now.cut ? "cut ends" : "plain ends"]), ...(ui.colorMode === "mono" ? ["mono"] : [])],
    changes,
  };
}

/** Desktop and tablet: one quiet row that stays under the header while you scroll. Phones: a floating button and a bottom sheet. */
export function StyleBar({ className }: { className?: string }) {
  const ui = useUi();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  // Half open: hovering or focusing the button shows the presets, a click opens everything.
  const [peek, setPeek] = useState(false);
  // First visit only: a pulse and a short hint so the button gets noticed once, then stays quiet.
  const [hint, setHint] = useState(false);
  const [mine, setMine] = useState<Mine | null>(null);
  useEffect(() => {
    setMine(readMine());
    try {
      if (window.localStorage.getItem(HINT_KEY) === "1") return;
    } catch {
      return;
    }
    const show = window.setTimeout(() => setHint(true), 900);
    const hide = window.setTimeout(() => setHint(false), 9000);
    return () => { window.clearTimeout(show); window.clearTimeout(hide); };
  }, []);
  const seen = () => {
    setHint(false);
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* storage can be blocked, the hint then shows again next visit */
    }
  };
  const applyMine = () => {
    if (!mine) return;
    ui.resetLab();
    if (Object.keys(mine.lab).length) ui.setLab(mine.lab);
    ui.setAccent(mine.accent);
  };
  // A saved style comes back on its own, unless a shared link already carries a style.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const q = new URLSearchParams(window.location.search);
    if (STYLE_QUERY.some((k) => q.has(k))) return;
    const mine = readMine();
    if (!mine) return;
    if (Object.keys(mine.lab).length) ui.setLab(mine.lab);
    if (mine.accent) ui.setAccent(mine.accent);
    // Runs once on mount, the setters are stable enough for that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The controls float over the page, so they close like a menu: Esc, or a click anywhere outside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); };
  }, [open]);
  const { chips, changes } = useSummary();
  return (
    <>
      <div ref={wrap} onPointerEnter={() => { setPeek(true); seen(); }} onPointerLeave={() => setPeek(false)} onFocus={() => setPeek(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPeek(false); }} className={cn("relative hidden shrink-0 md:block", className)}>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setPeek(false); seen(); }}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            "group inline-flex h-9 items-center gap-2 rounded-full border bg-background/80 pl-1.5 pr-3 text-xs font-medium text-foreground shadow-sm backdrop-blur-xl transition-all hover:border-orange-500/50 hover:shadow-md",
            (open || changes > 0) && "border-orange-500/60 bg-orange-500/[0.06]",
          )}
        >
          {hint && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-orange-500/60 animate-ping" />}
          <span className="flex items-center gap-1 rounded-full bg-muted/70 px-2 py-1">
            {PREVIEW.slice(0, 3).map((slug) => {
              const g = GLYPH_BY_SLUG.get(slug);
              return g ? (
                <span key={slug} className={ui.colorMode === "natural" && !ui.accent ? defaultColorOf(slug) || "text-foreground" : "text-foreground"}>
                  <Glyph nodes={g.nodes} variant={ui.variant} size={16} accent={ui.accent} />
                </span>
              ) : null;
            })}
          </span>
          Style
          <span className="hidden items-center gap-1.5 text-muted-foreground lg:flex">
            {chips.map((c) => <span key={c} className="capitalize">{c}</span>)}
            {ui.accent && <AccentDot hex={ui.accent} />}
          </span>
          {changes > 0 && <span className="grid size-4 place-items-center rounded-full bg-orange-500 text-[0.75rem] leading-none text-white">{changes}</span>}
          <UiGlyph name="chevron-down" className={cn("size-4 text-muted-foreground transition-transform group-hover:text-foreground", open && "rotate-180")} />
        </button>
        {hint && !open && !peek && (
          <span role="status" className="pointer-events-none absolute right-2 top-full z-40 mt-2 animate-in fade-in slide-in-from-top-1 whitespace-nowrap rounded-lg bg-orange-500 px-2.5 py-1 text-[0.75rem] font-medium text-white shadow-lg duration-300">
            Make the icons yours: weight, corners, colour
          </span>
        )}
        {peek && !open && (
          <div className="absolute right-0 top-full z-40 w-max max-w-[min(34rem,calc(100vw-3rem))] pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="rounded-xl border bg-background/90 p-2 opacity-95 shadow-xl backdrop-blur-xl">
              <div className="mb-1.5 flex items-center justify-between gap-6 px-1 text-[0.75rem] text-muted-foreground">
                <span>Quick styles</span>
                <span>Click Style for every control</span>
              </div>
              <Presets mine={mine} onApplyMine={applyMine} />
            </div>
          </div>
        )}
        {open && (
          <div role="dialog" aria-label="Icon style" className="absolute right-0 top-full z-50 w-[min(60rem,calc(100vw-3rem))] pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <StyleLab className="bg-background shadow-2xl ring-1 ring-black/5 dark:ring-white/10" />
          </div>
        )}
      </div>
      <StylePill />
    </>
  );
}

function AccentDot({ hex }: { hex: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current?.style.setProperty("--cur", hex);
  }, [hex]);
  return <span ref={ref} aria-hidden="true" className="size-3 rounded-full border bg-[var(--cur)]" />;
}

/** Phones only: a button that floats above the bottom dock and opens the controls in a sheet, so style is one tap away at any scroll position. */
export function StylePill() {
  const [open, setOpen] = useState(false);
  const { changes } = useSummary();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass fixed bottom-24 right-4 z-40 inline-flex h-10 items-center gap-2 rounded-full bg-background/90 px-4 text-xs font-medium shadow-lg backdrop-blur-xl md:hidden"
      >
        <UiGlyph name="sliders-horizontal" className="size-4" /> Style
        {changes > 0 && <span className="size-1.5 rounded-full bg-orange-500" />}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} fixedSnap="half" label="Icon style">
        <div className="px-4 pb-8">
          <StyleLab stacked className="border-0 bg-transparent p-0" />
        </div>
      </BottomSheet>
    </>
  );
}

/** The style lab on the page: every control re-draws all icons on screen live. */
export function StyleLab(props: { className?: string; stacked?: boolean }) {
  const ui = useUi();
  const now = useEffective();
  const { changes } = useSummary();
  const [mine, setMine] = useState<Mine | null>(null);
  useEffect(() => setMine(readMine()), []);
  const save = () => {
    const next: Mine = { lab: ui.lab, accent: ui.accent };
    try {
      window.localStorage.setItem(MINE_KEY, JSON.stringify(next));
    } catch {
      /* storage can be blocked, the style then lasts until reload */
    }
    setMine(next);
  };
  const applyMine = () => {
    if (!mine) return;
    ui.resetLab();
    if (Object.keys(mine.lab).length) ui.setLab(mine.lab);
    ui.setAccent(mine.accent);
  };
  const isMine = mine !== null && JSON.stringify(mine.lab) === JSON.stringify(ui.lab) && mine.accent === ui.accent;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border bg-card/70 p-3 backdrop-blur-xl", props.className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Presets mine={mine} onApplyMine={applyMine} />
        <PreviewStrip />
      </div>
      <div className={cn("grid items-start gap-x-5 gap-y-3", props.stacked ? "grid-cols-1" : "sm:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto]")}>
        <Range label="Weight" value={now.weight} base={now.base.strokeWidth} min={0.75} max={3} step={0.05} onChange={(v) => ui.setLab({ strokeWidth: r2(v) })} />
        <Range label="Scale" value={now.scale} base={now.base.scale} min={0.7} max={1.1} step={0.02} onChange={(v) => ui.setLab({ scale: r2(v) })} />
        <Range label="Shadow" value={now.shadow} base={now.base.shadow} min={0} max={0.6} step={0.05} onChange={(v) => ui.setLab({ shadow: r2(v) })} />
        <Cell label="Corners">
          <div className="flex items-center gap-2">
            <Segmented label="Corners" value={now.corner} options={CORNERS} onChange={(c) => ui.setLab({ corner: c, radius: c === "round" ? 3.5 : c === "sharp" ? 0 : 1.5 })} />
            <button
              type="button"
              role="switch"
              aria-checked={now.cut}
              aria-label="Cut ends"
              title="Cut ends"
              onClick={() => ui.setLab({ cutTerminals: !now.cut })}
              className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[0.75rem] transition-colors", now.cut ? "border-orange-500/50 bg-orange-500/10 text-foreground" : "text-muted-foreground")}
            >
              Cut
            </button>
          </div>
        </Cell>
        <Cell label={ui.accent ? "Colour, accent overrides" : "Colour"}>
          <div className="flex h-7 flex-wrap items-center gap-1.5">
            <Segmented label="Icon colours" value={ui.colorMode} options={["natural", "mono"] as const} onChange={ui.setColorMode} />
            <button type="button" aria-label="No accent" onClick={() => ui.setAccent("")} className={cn("h-5 rounded-full border px-2 text-[0.75rem] text-muted-foreground", ui.accent === "" && "border-foreground text-foreground")}>none</button>
            {SWATCHES.map((hex) => (
              <button key={hex} type="button" aria-label={`Accent #${hex}`} onClick={() => ui.setAccent(`#${hex}`)} className={cn("size-4 rounded-full border-2 transition-transform hover:scale-110", SWATCH_BG[hex], ui.accent === `#${hex}` ? "border-foreground" : "border-transparent")} />
            ))}
            <ColorPicker value={ui.accent} onChange={ui.setAccent} active={ui.accent !== "" && !SWATCHES.some((h) => `#${h}` === ui.accent)} />
          </div>
        </Cell>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-2 text-[0.75rem] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          Click copies
          <button
            type="button"
            role="switch"
            aria-checked={ui.clickToCopy}
            aria-label="Click an icon to copy it"
            onClick={() => ui.setClickToCopy(!ui.clickToCopy)}
            className={cn("relative h-5 w-9 rounded-full border transition-colors", ui.clickToCopy ? "border-orange-500/50 bg-orange-500/20" : "bg-muted/30")}
          >
            <span className={cn("absolute top-0.5 size-3.5 rounded-full bg-foreground transition-all", ui.clickToCopy ? "left-[1.15rem]" : "left-0.5 bg-muted-foreground")} />
          </button>
        </span>
        <span role="radiogroup" aria-label="What gets copied" className="flex flex-wrap gap-1">
          {COPY_TARGETS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={ui.copyTarget === t}
              title={COPY_HINT[t]}
              onClick={() => ui.setCopyTarget(t)}
              className={cn("h-6 rounded-md border px-2 transition-colors hover:text-foreground", ui.copyTarget === t && "border-orange-500/60 bg-orange-500/10 text-foreground")}
            >
              {COPY_LABEL[t]}
            </button>
          ))}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={save} disabled={changes === 0 || isMine} className="inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 transition-colors hover:text-foreground disabled:opacity-40">
            <UiGlyph name="bookmark" className="size-3.5" /> {isMine ? "Saved" : "Save as mine"}
          </button>
          <button type="button" onClick={() => { ui.resetLab(); ui.setAccent(""); ui.setColorMode("natural"); }} disabled={changes === 0} className="inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 transition-colors hover:text-foreground disabled:opacity-40">
            <UiGlyph name="rotate-ccw" className="size-3.5" /> Reset
          </button>
        </span>
      </div>
    </div>
  );
}
