"use client";

import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/ui-icons/utils";
import { useUi } from "./ui-state";

const SWATCHES = ["f5c542", "fb923c", "fb7185", "a78bfa", "38bdf8", "34d399"] as const;
const SWATCH_BG: Record<(typeof SWATCHES)[number], string> = {
  f5c542: "bg-[#f5c542]", fb923c: "bg-[#fb923c]", fb7185: "bg-[#fb7185]", a78bfa: "bg-[#a78bfa]", "38bdf8": "bg-[#38bdf8]", "34d399": "bg-[#34d399]",
};
const CORNERS = ["sharp", "chamfer", "round"] as const;

function Range(props: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="flex min-w-32 flex-1 flex-col gap-1">
      <span className="flex justify-between text-[10px] text-muted-foreground">
        {props.label}
        <span className="font-mono text-foreground">{props.value}</span>
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

/** Collapsed to one quiet row. Most visitors never need the controls, those who do open them once. */
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
  const touched = Object.keys(ui.lab).length > 0 || ui.accent !== "";
  return (
    <div className={cn("glass rounded-xl", className)}>
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground">
        <SlidersHorizontal className="size-3.5" />
        <span className="font-medium text-foreground">Style</span>
        <span className="truncate">{touched ? "customised" : "weight, corners, cut ends, accent"}</span>
        <ChevronDown className={cn("ml-auto size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <StyleLab className="rounded-t-none border-0 border-t bg-transparent backdrop-blur-none" />}
    </div>
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
    <div className={cn("flex flex-wrap items-end gap-x-4 gap-y-2 rounded-xl border bg-card/70 px-3 py-2 backdrop-blur-xl", props.stacked && "flex-col items-stretch", props.className)}>
      <Range label="Weight" value={weight} min={0.75} max={3} step={0.05} onChange={(v) => ui.setLab({ strokeWidth: Math.round(v * 100) / 100 })} />
      <Range label="Scale" value={scale} min={0.7} max={1.1} step={0.02} onChange={(v) => ui.setLab({ scale: Math.round(v * 100) / 100 })} />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground">Corners</span>
        <div className="flex gap-0.5 rounded-lg border p-0.5">
          {CORNERS.map((c) => (
            <button key={c} type="button" onClick={() => ui.setLab({ corner: c, radius: c === "round" ? 3.5 : 1.5 })} className={cn("rounded-md px-2 py-0.5 text-[11px] capitalize text-muted-foreground transition-colors hover:text-foreground", corner === c && "bg-foreground text-background hover:text-background")}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => ui.setLab({ cutTerminals: !cut })} className={cn("flex flex-col gap-1 text-left")}>
        <span className="text-[10px] text-muted-foreground">Cut ends</span>
        <span className={cn("rounded-lg border px-2.5 py-0.5 text-[11px] transition-colors", cut ? "border-orange-500/50 bg-orange-500/10 text-orange-400" : "text-muted-foreground")}>{cut ? "On" : "Off"}</span>
      </button>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground">Accent</span>
        <div className="flex items-center gap-1 py-0.5">
          <button type="button" aria-label="No accent" onClick={() => ui.setAccent("")} className={cn("h-5 rounded-full border px-2 text-[10px] text-muted-foreground", ui.accent === "" && "border-foreground text-foreground")}>none</button>
          {SWATCHES.map((hex) => (
            <button key={hex} type="button" aria-label={`Accent #${hex}`} onClick={() => ui.setAccent(`#${hex}`)} className={cn("size-4 rounded-full border-2", SWATCH_BG[hex], ui.accent === `#${hex}` ? "border-foreground" : "border-transparent")} />
          ))}
        </div>
      </div>
      <button type="button" aria-label="Reset style" onClick={() => { ui.resetLab(); ui.setAccent(""); }} className="grid size-7 place-items-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground">
        <RotateCcw className="size-3" />
      </button>
    </div>
  );
}
