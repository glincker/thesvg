"use client";

import { useState } from "react";
import { cn } from "@/lib/ui-icons/utils";
import { TheSVGMark, UiMark } from "./marks";

export type Mode = "brand" | "ui";

/**
 * Brand icons | UI icons. A pill slides between the two, the marks scale, and navigation waits for the pill to
 * land so the move is seen. Without a handler it only animates, which is how the proposal preview uses it.
 */
export function ModeSwitch({ mode, onChange, className }: { mode: Mode; onChange?: (m: Mode) => void; className?: string }) {
  const [busy, setBusy] = useState(false);
  const pick = (m: Mode) => {
    if (m === mode || busy) return;
    setBusy(true);
    window.setTimeout(() => {
      onChange?.(m);
      setBusy(false);
    }, 260);
  };
  const seg = (m: Mode, label: string, mark: React.ReactNode) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => pick(m)}
      className={cn(
        "relative z-10 flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors duration-300",
        mode === m ? "font-medium text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn("transition-transform duration-300", mode === m ? "scale-110" : "scale-100")}>{mark}</span>
      {label}
    </button>
  );
  return (
    <div role="tablist" aria-label="Icon type" className={cn("relative grid grid-cols-2 rounded-xl border bg-background/50 p-0.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-lg bg-foreground shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          mode === "ui" && "translate-x-full",
        )}
      />
      {seg("brand", "Brand icons", <TheSVGMark className="size-4" />)}
      {seg("ui", "UI icons", <UiMark className="size-4" />)}
    </div>
  );
}

/** The two marks stacked. Switching modes spins and fades one into the other. */
export function LogoMorph({ mode, className }: { mode: Mode; className?: string }) {
  const layer = (on: boolean) =>
    cn("absolute inset-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none", on ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-75 opacity-0");
  return (
    <span className={cn("relative inline-block", className)}>
      <TheSVGMark className={layer(mode === "brand")} />
      <UiMark className={layer(mode === "ui")} />
    </span>
  );
}
