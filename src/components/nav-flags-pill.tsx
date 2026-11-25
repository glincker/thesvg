"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const SAMPLE = ["us", "br", "jp"] as const;

/** The Flags tab: a button with three overlapping round flags. */
export function NavFlagsPill({ active, label }: Readonly<{ active: boolean; label: string }>) {
  return (
    <Link
      href="/collection/flags"
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
        active ? "border-transparent bg-foreground text-background shadow-sm" : "border-border bg-background text-foreground shadow-sm hover:border-orange-500/40 hover:bg-accent hover:shadow-md",
      )}
    >
      <span aria-hidden="true" className="flex items-center pr-0.5">
        {SAMPLE.map((code, i) => (
          <img
            key={code}
            src={`/icons/flag-${code}/circle.svg`}
            alt=""
            width={16}
            height={16}
            decoding="async"
            className={cn("size-4 rounded-full bg-white ring-1", active ? "ring-background/60" : "ring-foreground/15", i > 0 && "-ml-1")}
          />
        ))}
      </span>
      {label}
    </Link>
  );
}
