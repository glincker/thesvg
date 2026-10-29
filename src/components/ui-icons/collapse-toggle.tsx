"use client";

import { useSyncExternalStore } from "react";
import { UiGlyph } from "@/components/ui-glyph";

const subscribe = () => () => {};
const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
const getServerIsMac = () => false;

/** Edge strip on the sidebar: the whole strip is the click target, the round button is a hint that shows on hover. */
export function CollapseToggle({ collapsed, onToggle }: Readonly<{ collapsed: boolean; onToggle: () => void }>) {
  const isMac = useSyncExternalStore(subscribe, getIsMac, getServerIsMac);
  const label = `${collapsed ? "Expand sidebar" : "Collapse sidebar"} (${isMac ? "⌘\\" : "Ctrl+\\"})`;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={label}
      aria-keyshortcuts={isMac ? "Meta+\\" : "Control+\\"}
      title={label}
      className="group/rail absolute inset-y-0 -right-3 z-20 flex w-6 cursor-pointer items-start justify-center pt-4 after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors after:duration-200 hover:after:bg-border focus-visible:outline-none dark:hover:after:bg-white/20"
    >
      <span className="pointer-events-none flex size-6 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground/70 opacity-0 shadow-sm transition-all duration-200 group-hover/sidebar:opacity-100 group-hover/rail:scale-110 group-hover/rail:border-foreground/30 group-hover/rail:text-foreground group-focus-visible/rail:opacity-100 group-focus-visible/rail:ring-2 group-focus-visible/rail:ring-ring group-focus-visible/rail:ring-offset-2 dark:border-white/[0.1] dark:bg-[#0f0f10]">
        <UiGlyph name={collapsed ? "panel-left-open" : "panel-left-close"} className="size-3.5" />
      </span>
    </button>
  );
}
