"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  /** When true, renders as a fixed-size icon-only rail button/link and shows
   * the label as a hover/focus tooltip instead of inline text. */
  collapsed: boolean;
  icon: LucideIcon;
  label: string;
  /** Applies the shared active-row styling (gradient background). Omit and
   * fold custom active styling into `className` for rows that need a
   * different treatment (e.g. the highlighted Submit row). */
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  /** Extra content (badges, counts, chevrons) shown only when expanded. */
  trailing?: ReactNode;
}

const baseItemClass =
  "group flex items-center rounded-xl text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/80 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const activeItemClass =
  "bg-gradient-to-r from-accent/80 to-accent/40 text-accent-foreground font-medium shadow-sm shadow-black/[0.03] dark:from-white/[0.08] dark:to-white/[0.04] dark:shadow-black/20";

/**
 * A single pinned-nav row. Renders a full labeled row when expanded, or a
 * centered icon-only rail button with a hover/focus tooltip when collapsed
 * (the tablet-width "navigation rail" pattern).
 */
export function SidebarNavItem({
  collapsed,
  icon: Icon,
  label,
  active,
  href,
  onClick,
  className,
  iconClassName,
  trailing,
}: SidebarNavItemProps) {
  const rowClass = cn(
    baseItemClass,
    collapsed ? "mx-auto h-10 w-10 justify-center" : "w-full gap-3 px-3 py-2",
    active && activeItemClass,
    className,
  );

  const body = (
    <>
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
          iconClassName,
        )}
      />
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <>
          <span className="flex-1 truncate text-left">{label}</span>
          {trailing}
        </>
      )}
    </>
  );

  const element = href ? (
    <Link href={href} className={rowClass}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={rowClass}>
      {body}
    </button>
  );

  if (!collapsed) return element;

  return (
    <Tooltip>
      <TooltipTrigger render={element} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
