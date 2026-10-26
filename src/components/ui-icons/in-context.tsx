"use client";

import type { Variant } from "@/lib/ui-icons/engine";
import { Search } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { VARIANTS, type Glyph as GlyphData } from "@/lib/ui-icons/glyphs";
import { cn } from "@/lib/ui-icons/utils";
import { Glyph } from "./glyph";
import { useUi } from "./ui-state";

type StateName = "rest" | "hover" | "active";
type Force = "live" | StateName;

interface StateMap {
  rest: Variant;
  hover: Variant;
  active: Variant;
}

const Ctx = createContext<{ glyph: GlyphData; map: StateMap; force: Force; accent: string } | null>(null);

function useCtx() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StateGlyph must be used inside InContext");
  return v;
}

/**
 * The glyph for an interactive element. Live mode stacks the three looks and lets CSS pick one, so hover,
 * keyboard focus and the pressed state switch instantly with no re-render. A forced state shows just that look.
 * The parent element must be a `group` and set data-on when it is toggled on.
 */
function StateGlyph({ size = 18 }: { size?: number }) {
  const { glyph, map, force, accent } = useCtx();
  const g = (variant: Variant) => <Glyph nodes={glyph.nodes} variant={variant} size={size} accent={accent} />;
  if (force !== "live") return <span className="inline-flex">{g(map[force])}</span>;
  return (
    <span className="inline-grid transition-transform duration-150 group-hover:scale-110 group-data-[on=true]:scale-100 motion-reduce:transform-none">
      <span className="[grid-area:1/1] transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0 group-data-[on=true]:opacity-0">{g(map.rest)}</span>
      <span className="[grid-area:1/1] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[on=true]:opacity-0!">{g(map.hover)}</span>
      <span className="[grid-area:1/1] opacity-0 transition-opacity group-data-[on=true]:opacity-100">{g(map.active)}</span>
    </span>
  );
}

function Pick(props: { label: string; value: Variant; onChange: (v: Variant) => void }) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
      {props.label}
      <select value={props.value} onChange={(e) => props.onChange(e.target.value as Variant)} className="rounded-lg border bg-background/60 px-2 py-1 text-xs capitalize text-foreground outline-none focus:border-ring">
        {VARIANTS.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </label>
  );
}

function Surface({ dark }: { dark: boolean }) {
  const [pressed, setPressed] = useState(false);
  const [tab, setTab] = useState(0);
  const [focused, setFocused] = useState(false);
  const [bell, setBell] = useState(true);
  const [chips, setChips] = useState<boolean[]>([true, false, false]);
  const edge = dark ? "border-zinc-700" : "border-zinc-300";
  const hoverBg = dark ? "hover:bg-zinc-800" : "hover:bg-zinc-200/70";
  return (
    <div className={cn("flex min-w-0 flex-col gap-3 rounded-2xl border p-4", dark ? "border-zinc-800 bg-zinc-950 text-zinc-100" : "border-zinc-200 bg-zinc-50 text-zinc-900")}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={pressed}
          data-on={pressed}
          onClick={() => setPressed(!pressed)}
          className={cn("group inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-transform active:scale-95", dark ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-50")}
        >
          <StateGlyph /> {pressed ? "Pressed" : "Action"}
        </button>
        <button type="button" className={cn("group inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors active:scale-95", edge, hoverBg)}>
          <StateGlyph /> Secondary
        </button>
        <button type="button" aria-label="Icon button" className={cn("group grid size-9 place-items-center rounded-lg border transition-colors active:scale-95", edge, hoverBg)}>
          <StateGlyph size={20} />
        </button>
      </div>

      <div role="tablist" className={cn("flex items-center gap-1 rounded-xl p-1 text-sm", dark ? "bg-zinc-900" : "bg-zinc-200/70")}>
        {["Overview", "Activity", "Settings"].map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === i}
            data-on={tab === i}
            onClick={() => setTab(i)}
            className={cn(
              "group flex min-w-0 flex-1 items-center justify-center gap-2 truncate rounded-lg py-1.5 transition-colors",
              tab === i ? (dark ? "bg-zinc-700" : "bg-white shadow-sm") : cn("opacity-70 hover:opacity-100", hoverBg),
            )}
          >
            <StateGlyph size={16} /> <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <label
        data-on={focused}
        className={cn("group flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors", dark ? "border-zinc-700 text-zinc-300" : "border-zinc-300 text-zinc-700", focused && "border-orange-500")}
      >
        <StateGlyph size={16} />
        <input onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Type to focus this field" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-current placeholder:opacity-50" />
        <Search className="size-3.5 opacity-50" />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={bell}
          data-on={bell}
          onClick={() => setBell(!bell)}
          className={cn("group relative inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors", hoverBg)}
        >
          <StateGlyph size={22} />
          {bell && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-orange-500" />}
          <span className={bell ? "" : "opacity-60"}>Notifications {bell ? "on" : "off"}</span>
        </button>
        {chips.map((on, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={on}
            aria-label={`Toggle chip ${i + 1}`}
            data-on={on}
            onClick={() => setChips((c) => c.map((x, j) => (j === i ? !x : x)))}
            className={cn("group grid size-9 place-items-center rounded-lg border transition-colors active:scale-95", edge, hoverBg, on && (dark ? "bg-zinc-800" : "bg-white shadow-sm"))}
          >
            <StateGlyph size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Interactive demo: hover, focus, press and toggle all work, and each state's look can be chosen. */
export function InContext({ glyph }: { glyph: GlyphData }) {
  const ui = useUi();
  const [active, setActive] = useState<Variant>("fill");
  const [hover, setHover] = useState<Variant | "same">("same");
  const [force, setForce] = useState<Force>("live");
  const map: StateMap = { rest: ui.variant, hover: hover === "same" ? ui.variant : hover, active };
  return (
    <Ctx.Provider value={{ glyph, map, force, accent: ui.accent }}>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 glass rounded-xl px-4 py-2">
        <span className="text-[11px] text-muted-foreground">Rest <span className="ml-1 rounded-md border px-1.5 py-0.5 capitalize text-foreground">{ui.variant}</span></span>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          Hover
          <select value={hover} onChange={(e) => setHover(e.target.value as Variant | "same")} className="rounded-lg border bg-background/60 px-2 py-1 text-xs capitalize text-foreground outline-none focus:border-ring">
            <option value="same">same as rest</option>
            {VARIANTS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <Pick label="Active" value={active} onChange={setActive} />
        <div className="ml-auto flex items-center gap-1 rounded-lg border p-0.5" role="group" aria-label="Show state">
          {(["live", "rest", "hover", "active"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setForce(f)} className={cn("rounded-md px-2.5 py-1 text-xs capitalize text-muted-foreground transition-colors hover:text-foreground", force === f && "bg-foreground text-background hover:text-background")}>
              {f === "live" ? "Interactive" : f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Surface dark />
        <Surface dark={false} />
      </div>
    </Ctx.Provider>
  );
}
