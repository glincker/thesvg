"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const SEEN_KEY = "thesvg:flags-nav-seen";
const SAMPLE = ["us", "br", "jp"] as const;

const subscribe = (cb: () => void): (() => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const readSeen = (): boolean => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

/** The Flags tab: three overlapping round flags and a "New" badge until the page has been opened once. */
export function NavFlagsPill({ active, label }: Readonly<{ active: boolean; label: string }>) {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  const markSeen = (): void => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
      window.dispatchEvent(new Event("storage"));
    } catch {
      /* storage unavailable: the badge simply stays */
    }
  };
  return (
    <Link
      href="/collection/flags"
      onClick={markSeen}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full py-1 pl-2 pr-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span aria-hidden="true" className="flex items-center">
        {SAMPLE.map((code, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={code}
            src={`/icons/flag-${code}/circle.svg`}
            alt=""
            width={18}
            height={18}
            decoding="async"
            className={cn("size-[18px] rounded-full ring-2", active ? "ring-foreground" : "ring-background", i > 0 && "-ml-1.5")}
          />
        ))}
      </span>
      {label}
      {!seen && !active ? <span className="rounded-full bg-orange-500 px-1.5 py-px text-[0.625rem] font-semibold uppercase leading-none tracking-wide text-white">New</span> : null}
    </Link>
  );
}
