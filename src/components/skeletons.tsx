import { Suspense, type ReactNode } from "react";
import { TheSVGMark } from "@/components/icons/the-svg-mark";
import { cn } from "@/lib/utils";

/**
 * Static loading shells used as Suspense fallbacks.
 *
 * Client components that read `useSearchParams()` (the header and the browse
 * surface) bail to their nearest Suspense boundary during prerender and
 * hydration. Without a fallback that bail escapes upward and the whole route
 * drops to the full-screen `app/loading.tsx` spinner, which also removes the
 * navigation. These shells keep the chrome on screen and reserve the content
 * space so the page does not look dead while it hydrates.
 *
 * They are server components with no hooks, so they never suspend themselves.
 */

/** A single pulsing placeholder bar; callers set size, radius and shade. */
export function Pulse({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded bg-muted-foreground/10", className)}
    />
  );
}

/** Desktop header shell, mirrors the real header's card, height and logo. */
export function HeaderSkeleton() {
  return (
    <div
      aria-hidden
      className="sticky top-[var(--banner-h,0px)] z-50 hidden w-full px-2 pt-2 pb-0 sm:px-3 sm:pt-2.5 lg:block"
    >
      <div className="mx-auto flex h-12 max-w-[1800px] items-center gap-3 rounded-2xl border border-black/[0.06] bg-background/90 px-4 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-black/60">
        <TheSVGMark className="h-9 w-9 rounded-lg" />
        <Pulse className="h-4 w-16 bg-muted-foreground/15" />
        <Pulse className="h-8 flex-1 rounded-lg" />
        <Pulse className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/** Mobile floating top-bar shell, mirrors the real mobile bar. */
export function MobileHeaderSkeleton() {
  return (
    <div
      aria-hidden
      className="surface-glass fixed inset-x-3 top-[max(12px,calc(var(--safe-top)+12px))] z-30 mx-auto max-w-md rounded-[24px] border border-border/40 lg:hidden dark:border-white/[0.08]"
    >
      <div className="flex h-12 items-center gap-2 px-2">
        <TheSVGMark className="h-8 w-8 rounded-lg" />
        <Pulse className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Route-agnostic content shell for the layout-level boundary, which wraps every
 * page. It reserves the content height so the chrome stays put during hydration
 * without implying a specific page layout.
 */
export function ContentSkeleton() {
  return (
    <div aria-hidden className="mx-auto min-h-[60vh] max-w-7xl px-3 py-6 sm:px-4">
      <Pulse className="h-6 w-40" />
      <Pulse className="mt-3 h-4 w-full max-w-md bg-muted-foreground/[0.06]" />
    </div>
  );
}

/** Grid route skeleton for the browse surfaces (home, category, collection). */
export function BrowseSkeleton() {
  return (
    <div aria-hidden className="md:pl-58">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
        <Pulse className="mb-4 h-6 w-32" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <Pulse
              key={i}
              className="aspect-[4/5] rounded-xl border border-border/40 bg-muted-foreground/[0.06]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Suspense boundary for the browse pages. Pairing the boundary with its fallback
 * here keeps every browse route in sync from one place.
 */
export function BrowseSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<BrowseSkeleton />}>{children}</Suspense>;
}
