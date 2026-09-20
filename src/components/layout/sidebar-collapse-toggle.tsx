import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarCollapseToggleProps {
  collapsed: boolean;
  onToggle?: () => void;
}

/** Full-height edge strip (shadcn SidebarRail pattern) - the icon is a
 * decorative hint, the whole strip is the actual click target. */
export function SidebarCollapseToggle({ collapsed, onToggle }: Readonly<SidebarCollapseToggleProps>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="group/rail absolute inset-y-0 -right-2 z-20 flex w-4 cursor-pointer items-start justify-center pt-4 after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors after:duration-200 hover:after:bg-border dark:hover:after:bg-white/20"
    >
      <span
        className={cn(
          "pointer-events-none flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground/70 opacity-0 shadow-sm transition-all duration-200 group-hover/sidebar:opacity-100 group-hover/rail:scale-110 group-hover/rail:border-foreground/30 group-hover/rail:text-foreground group-focus-visible/rail:opacity-100 dark:border-white/[0.1] dark:bg-[#0f0f10]",
        )}
      >
        {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
