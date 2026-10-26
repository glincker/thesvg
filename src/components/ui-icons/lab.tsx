"use client";

import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { ColorPicker } from "./color-picker";
import { cn } from "@/lib/ui-icons/utils";
import { useUi } from "./ui-state";

const SWATCHES = ["f5c542", "fb923c", "fb7185", "a78bfa", "38bdf8", "34d399"] as const;
const SWATCH_BG: Record<(typeof SWATCHES)[number], string> = {
  f5c542: "bg-[#f5c542]", fb923c: "bg-[#fb923c]", fb7185: "bg-[#fb7185]", a78bfa: "bg-[#a78bfa]", "38bdf8": "bg-[#38bdf8]", "34d399": "bg-[#34d399]",
};
const CORNERS = ["sharp", "chamfer", "round"] as const;

function Range(props: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="flex items-center justify-between text-[11px] text-muted-foreground">
        {props.label}
        <span className="rounded-md bg-muted px-1.5 py-px font-mono text-[10px] text-foreground">{props.value}</span>
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

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/** What the style currently is, in words and one color dot, so the collapsed bar says something useful. */
function useSummary(): { chips: string[]; touched: boolean } {
  const ui = useUi();
  const glass = ui.variant === "glass";
  const weight = ui.lab.strokeWidth ?? (glass ? 1.5 : 1.75);
  const corner = ui.lab.corner ?? (glass ? "round" : "chamfer");
  const cut = ui.lab.cutTerminals ?? !glass;
  return {
    chips: [`weight ${weight}`, corner, cut ? "cut ends" : "plain ends"],
    touched: Object.keys(ui.lab).length > 0 || ui.accent !== "",
  };
}

/** Desktop and tablet: one quiet row that stays under the header while you scroll. Phones: a floating button and a bottom sheet. */
export function StyleBar({ className }: { className?: string }) {
  const ui = useUi();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem("svg-icons-lab-open") === "1");
    } catch {
      setOpen(false);
    }
  }, []);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem("svg-icons-lab-open", next ? "1" : "0");
    } catch {
      /* storage can be blocked, the panel then just starts closed */
    }
  };
  const { chips, touched } = useSummary();
  return (
    <>
      <div className={cn("glass hidden rounded-xl bg-background/95 backdrop-blur-xl md:sticky md:top-[calc(4.25rem+var(--banner-h,0px)+0.25rem)] md:z-30 md:block", className)}>
        <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground">
          <SlidersHorizontal className="size-3.5" />
          <span className="font-medium text-foreground">Style</span>
          <span className="hidden items-center gap-1.5 sm:flex">
            {chips.map((c) => (
              <span key={c} className="rounded-full border px-2 py-px text-[10px] capitalize">{c}</span>
            ))}
            {ui.accent && <AccentDot hex={ui.accent} />}
          </span>
          {touched && <span className="rounded-full bg-orange-500/10 px-2 py-px text-[10px] text-orange-400">customised</span>}
          <ChevronDown className={cn("ml-auto size-3.5 transition-transform", open && "rotate-180")} />
        </button>
        {open && <StyleLab className="rounded-t-none border-0 border-t bg-transparent" />}
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
  const { touched } = useSummary();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass fixed bottom-24 right-4 z-40 inline-flex h-10 items-center gap-2 rounded-full bg-background/90 px-4 text-xs font-medium shadow-lg backdrop-blur-xl md:hidden"
      >
        <SlidersHorizontal className="size-3.5" /> Style
        {touched && <span className="size-1.5 rounded-full bg-orange-500" />}
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
  const weight = ui.lab.strokeWidth ?? (ui.variant === "glass" ? 1.5 : 1.75);
  const scale = ui.lab.scale ?? (ui.variant === "glass" ? 1 : 0.92);
  const corner = ui.lab.corner ?? (ui.variant === "glass" ? "round" : "chamfer");
  const cut = ui.lab.cutTerminals ?? ui.variant !== "glass";
  return (
    <div className={cn("grid gap-x-5 gap-y-4 rounded-xl border bg-card/70 p-4 backdrop-blur-xl", props.stacked ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto_auto] xl:items-end", props.className)}>
      <Range label="Weight" value={weight} min={0.75} max={3} step={0.05} onChange={(v) => ui.setLab({ strokeWidth: Math.round(v * 100) / 100 })} />
      <Range label="Scale" value={scale} min={0.7} max={1.1} step={0.02} onChange={(v) => ui.setLab({ scale: Math.round(v * 100) / 100 })} />
      <Cell label="Corners">
        <div role="radiogroup" aria-label="Corners" className="flex gap-0.5 rounded-lg border bg-muted/30 p-0.5">
          {CORNERS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={corner === c}
              onClick={() => ui.setLab({ corner: c, radius: c === "round" ? 3.5 : 1.5 })}
              className={cn("h-6 flex-1 rounded-md px-2.5 text-[11px] capitalize text-muted-foreground transition-colors hover:text-foreground", corner === c && "bg-foreground text-background hover:text-background")}
            >
              {c}
            </button>
          ))}
        </div>
      </Cell>
      <Cell label="Cut ends">
        <button
          type="button"
          role="switch"
          aria-checked={cut}
          aria-label="Cut ends"
          onClick={() => ui.setLab({ cutTerminals: !cut })}
          className={cn("relative h-7 w-12 rounded-full border transition-colors", cut ? "border-orange-500/50 bg-orange-500/20" : "bg-muted/30")}
        >
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-foreground transition-all", cut ? "left-[1.35rem]" : "left-0.5 bg-muted-foreground")} />
        </button>
      </Cell>
      <Cell label="Accent">
        <div className="flex h-7 items-center gap-1.5">
          <button type="button" aria-label="No accent" onClick={() => ui.setAccent("")} className={cn("h-5 rounded-full border px-2 text-[10px] text-muted-foreground", ui.accent === "" && "border-foreground text-foreground")}>none</button>
          {SWATCHES.map((hex) => (
            <button key={hex} type="button" aria-label={`Accent #${hex}`} onClick={() => ui.setAccent(`#${hex}`)} className={cn("size-4 rounded-full border-2", SWATCH_BG[hex], ui.accent === `#${hex}` ? "border-foreground" : "border-transparent")} />
          ))}
          <ColorPicker value={ui.accent} onChange={ui.setAccent} active={ui.accent !== "" && !SWATCHES.some((h) => `#${h}` === ui.accent)} />
        </div>
      </Cell>
      <button type="button" onClick={() => { ui.resetLab(); ui.setAccent(""); }} className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
        <RotateCcw className="size-3" /> Reset
      </button>
    </div>
  );
}
