"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS_NAV } from "@/lib/docs-nav";
import { DocsBrandIcon } from "@/components/docs/docs-nav-icon";
import { cn } from "@/lib/utils";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Docs navigation"
      // Precise offset clears the desktop header, which switches on at the
      // same md: breakpoint (see fix/tablet-foldable-breakpoint) - keep
      // these in sync if that breakpoint ever changes again.
      className="sticky top-20 hidden h-fit w-52 shrink-0 md:top-[calc(4.25rem+var(--banner-h,0px)+1rem)] md:block"
    >
      <div className="max-h-[calc(100vh-8rem)] space-y-6 overflow-y-auto pr-2 pb-8">
        {DOCS_NAV.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-accent font-medium text-accent-foreground dark:bg-white/[0.06]"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground dark:hover:bg-white/[0.04]"
                    )}
                  >
                    {item.icon.kind === "brand" ? (
                      <DocsBrandIcon slug={item.icon.slug} className="h-4 w-4 shrink-0 opacity-80" />
                    ) : (
                      <item.icon.Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
