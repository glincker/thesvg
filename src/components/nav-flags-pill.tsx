"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useT } from "@/i18n/use-t";
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
  const { t } = useT();
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
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span aria-hidden="true" className="flex items-center pr-0.5">
        {SAMPLE.map((code, i) => (
          // eslint-disable-next-line @next/next/no-img-element
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
      {!seen && !active ? <span className="ml-0.5 rounded-full bg-orange-500 px-1.5 py-px text-[0.5625rem] font-semibold uppercase leading-none tracking-wide text-white">{t("chrome.flagsPill.new")}</span> : null}
    </Link>
  );
}
