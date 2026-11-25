import type { ReactNode } from "react";
import Link from "next/link";
import { withUtm } from "@/lib/external-link";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

// Byline stays readable at every size: the wordmark never drops below 12px tall.
const SIZES: Record<Size, { name: string; by: string; mark: string; gap: string }> = {
  sm: { name: "text-[17px]", by: "text-[9.5px]", mark: "h-3 w-auto", gap: "gap-[3px]" },
  md: { name: "text-[22px]", by: "text-[10.5px]", mark: "h-3.5 w-auto", gap: "gap-1" },
  lg: { name: "text-2xl", by: "text-[11px]", mark: "h-4 w-auto", gap: "gap-1.5" },
};

interface BrandLockupProps {
  /** The sized logo mark; the header passes the morphing mark, others the static one. */
  mark: ReactNode;
  homeLabel: string;
  utmSource: string;
  size?: Size;
  /** Hide the text block below this breakpoint (the header shows the mark alone on phones). */
  textClassName?: string;
  className?: string;
}

/** theSVG mark, name and a "by GLINR Studios" wordmark byline, shared by the navbar, mobile bar and footer. */
export function BrandLockup({ mark, homeLabel, utmSource, size = "md", textClassName, className }: Readonly<BrandLockupProps>) {
  const s = SIZES[size];
  return (
    <div className={cn("group/logo flex items-center gap-2", className)}>
      <Link href="/" className="shrink-0 text-foreground" aria-label={homeLabel}>
        {mark}
      </Link>
      <div className={cn("flex flex-col", s.gap, textClassName)}>
        <Link href="/" tabIndex={-1} aria-hidden="true" className={cn("leading-none font-extrabold tracking-tight text-foreground", s.name)}>
          the<span className="text-orange-500">SVG</span>
        </Link>
        <a
          href={withUtm("https://glinr.com", utmSource)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex w-fit items-center gap-1.5 rounded-sm leading-none text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            s.by,
          )}
        >
          by
          { }
          <img src="/icons/glinr/wordmark-dark.svg" alt="GLINR Studios" width={91} height={14} className={cn("hidden dark:block", s.mark)} />
          { }
          <img src="/icons/glinr/wordmark-light.svg" alt="GLINR Studios" width={91} height={14} className={cn("block dark:hidden", s.mark)} />
        </a>
      </div>
    </div>
  );
}
