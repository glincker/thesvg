"use client";

import { UiGlyph } from "@/components/ui-glyph";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/ui-icons/utils";

interface Hsv { h: number; s: number; v: number }
interface EyeDropperLike { open: () => Promise<{ sRGBHex: string }> }
type EyeDropperCtor = new () => EyeDropperLike;

const RECENT_KEY = "ui-icons:recent-colors";
const RECENT_MAX = 6;

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

function hexToHsv(hex: string): Hsv {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { h: 24, s: 90, v: 98 };
  const n = Number.parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: Math.round(((h * 60) + 360) % 360), s: Math.round(max ? (d / max) * 100 : 0), v: Math.round(max * 100) };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const S = s / 100, V = v / 100, c = V * S, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = V - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function normaliseHex(raw: string): string | null {
  const t = raw.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(t)) return `#${t.split("").map((c) => c + c).join("")}`.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(t)) return `#${t}`.toLowerCase();
  return null;
}

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

/** Sets CSS variables from state so the dynamic colors need no inline style attribute. */
function useVars(ref: React.RefObject<HTMLElement | null>, vars: Record<string, string>): void {
  const key = JSON.stringify(vars);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const [k, v] of Object.entries(JSON.parse(key) as Record<string, string>)) el.style.setProperty(k, v);
  }, [ref, key]);
}

/** A custom color picker: saturation and brightness area, hue slider, hex field, eyedropper where supported, recent colors. */
export function ColorPicker({ value, onChange, active }: { value: string; onChange: (hex: string) => void; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [hsv, setHsvState] = useState<Hsv>(() => hexToHsv(value));
  // The ref mirrors state so a drag in progress always reads the latest color without re-subscribing.
  const hsvRef = useRef<Hsv>(hexToHsv(value));
  const setHsv = (next: Hsv) => { hsvRef.current = next; setHsvState(next); };
  const [hexText, setHexText] = useState(value || "");
  const [recent, setRecent] = useState<string[]>([]);
  const [canPipette, setCanPipette] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const hue = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = hsvToHex(hsv);

  useEffect(() => {
    setCanPipette("EyeDropper" in window);
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  useVars(pop, { "--h": `${hsv.h}`, "--cur": current });
  useVars(area, { "--x": `${hsv.s}%`, "--y": `${100 - hsv.v}%` });
  useVars(hue, { "--x": `${(hsv.h / 360) * 100}%` });
  useVars(trigger, { "--cur": value || current });

  const apply = (next: Hsv) => {
    setHsv(next);
    const hex = hsvToHex(next);
    setHexText(hex);
    onChange(hex);
  };
  const remember = (hex: string) => {
    const next = [hex, ...recent.filter((c) => c !== hex)].slice(0, RECENT_MAX);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage unavailable, recents last for the session */ }
  };
  const drag = (el: HTMLElement, e: React.PointerEvent, fn: (fx: number, fy: number) => void) => {
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      fn(clamp((ev.clientX - r.left) / r.width, 0, 1), clamp((ev.clientY - r.top) / r.height, 0, 1));
    };
    move(e.nativeEvent);
    const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); remember(hsvToHex(hsvRef.current)); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };
  const key = (e: React.KeyboardEvent, axes: { dx?: (d: number) => Partial<Hsv>; dy?: (d: number) => Partial<Hsv> }) => {
    const step = e.shiftKey ? 10 : 1;
    const patch =
      e.key === "ArrowRight" ? axes.dx?.(step) : e.key === "ArrowLeft" ? axes.dx?.(-step) : e.key === "ArrowUp" ? axes.dy?.(step) : e.key === "ArrowDown" ? axes.dy?.(-step) : undefined;
    if (!patch) return;
    e.preventDefault();
    apply({ ...hsv, ...patch });
  };

  const pipette = async () => {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
    if (!Ctor) return;
    try {
      const { sRGBHex } = await new Ctor().open();
      const hex = normaliseHex(sRGBHex);
      if (hex) { apply(hexToHsv(hex)); remember(hex); }
    } catch { /* the user left eyedropper mode with Escape */ }
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label="Custom color"
        aria-expanded={open}
        onClick={() => {
          if (!open) {
            setHsv(hexToHsv(value || current));
            setHexText(value || current);
            // Flip upward when there is no room below, so the popover is never cut off.
            const r = trigger.current?.getBoundingClientRect();
            setAbove(r ? window.innerHeight - r.bottom < 330 : false);
          }
          setOpen((o) => !o);
        }}
        className={cn("size-4 rounded-full border-2 bg-[conic-gradient(from_0deg,#f43f5e,#f59e0b,#84cc16,#06b6d4,#6366f1,#d946ef,#f43f5e)]", active ? "border-foreground bg-none bg-[var(--cur)]" : "border-transparent")}
      />
      {open && (
        <div ref={pop} role="dialog" aria-label="Pick a color" className={cn("absolute right-0 z-50 w-[232px] rounded-2xl border bg-popover p-3 shadow-2xl", above ? "bottom-full mb-2" : "top-full mt-2")}>
          <div
            ref={area}
            role="slider"
            tabIndex={0}
            aria-label="Saturation and brightness"
            aria-valuetext={`saturation ${hsv.s} percent, brightness ${hsv.v} percent`}
            aria-valuenow={hsv.s}
            aria-valuemin={0}
            aria-valuemax={100}
            onPointerDown={(e) => drag(e.currentTarget, e, (fx, fy) => apply({ ...hsvRef.current, s: Math.round(fx * 100), v: Math.round((1 - fy) * 100) }))}
            onKeyDown={(e) => key(e, { dx: (d) => ({ s: clamp(hsv.s + d, 0, 100) }), dy: (d) => ({ v: clamp(hsv.v + d, 0, 100) }) })}
            className="relative h-28 w-full cursor-crosshair touch-none rounded-lg bg-[linear-gradient(to_top,#000,transparent),linear-gradient(to_right,#fff,transparent)] bg-[hsl(var(--h)_100%_50%)] outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
          >
            <span className="pointer-events-none absolute left-[var(--x)] top-[var(--y)] size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
          </div>
          <div
            ref={hue}
            role="slider"
            tabIndex={0}
            aria-label="Hue"
            aria-valuenow={hsv.h}
            aria-valuemin={0}
            aria-valuemax={360}
            onPointerDown={(e) => drag(e.currentTarget, e, (fx) => apply({ ...hsvRef.current, h: Math.round(fx * 360) }))}
            onKeyDown={(e) => key(e, { dx: (d) => ({ h: (hsv.h + d * 2 + 360) % 360 }) })}
            className="relative mt-3 h-3 w-full cursor-pointer touch-none rounded-full bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
          >
            <span className="pointer-events-none absolute left-[var(--x)] top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[hsl(var(--h)_100%_50%)] shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="size-7 shrink-0 rounded-lg border bg-[var(--cur)]" aria-hidden="true" />
            <input
              aria-label="Hex color"
              value={hexText}
              spellCheck={false}
              onChange={(e) => {
                setHexText(e.target.value);
                const hex = normaliseHex(e.target.value);
                if (hex) { setHsv(hexToHsv(hex)); onChange(hex); }
              }}
              onBlur={() => { const hex = normaliseHex(hexText); if (hex) remember(hex); else setHexText(current); }}
              className="h-7 min-w-0 flex-1 rounded-lg border bg-transparent px-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
            />
            {canPipette && (
              <button type="button" aria-label="Pick a color from the screen" onClick={pipette} className="grid size-7 shrink-0 place-items-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground">
                <UiGlyph name="target" className="size-4" />
              </button>
            )}
          </div>
          {recent.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[0.75rem] text-muted-foreground">Recent</p>
              <div className="flex gap-1.5">
                {recent.map((c) => (
                  <RecentDot key={c} hex={c} onPick={() => { apply(hexToHsv(c)); }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecentDot({ hex, onPick }: { hex: string; onPick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useVars(ref, { "--cur": hex });
  return <button ref={ref} type="button" aria-label={`Use ${hex}`} onClick={onPick} className="size-5 rounded-full border bg-[var(--cur)]" />;
}
