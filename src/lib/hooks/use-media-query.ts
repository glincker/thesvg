"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook. Returns `false` on the server to avoid
 * hydration mismatches, then reconciles on first client paint.
 *
 * Example: `const isMobile = useMediaQuery("(max-width: 1023.98px)");`
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
      }
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return false;
      }
      return window.matchMedia(query).matches;
    },
    () => false,
  );
}

/**
 * Convenience wrapper: `true` below the Tailwind `lg` breakpoint (1024px).
 * Drives the mobile shell — bottom dock, sheets, intercepted icon view.
 */
export function useIsMobileShell(): boolean {
  return useMediaQuery("(max-width: 1023.98px)");
}

/**
 * `true` when the user has requested reduced motion. Skills/anims should
 * collapse to opacity fades or no-op.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * `true` when the browser/OS requests reduced transparency, or the user
 * has Save-Data on. Used to disable backdrop-filter in favor of solid
 * surface tokens on low-end devices.
 */
export function usePrefersReducedTransparency(): boolean {
  const reduced = useMediaQuery("(prefers-reduced-transparency: reduce)");
  const saveData = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof navigator === "undefined") return false;
      const conn = (
        navigator as unknown as { connection?: { saveData?: boolean } }
      ).connection;
      return Boolean(conn?.saveData);
    },
    () => false,
  );
  return reduced || saveData;
}

/**
 * `true` when the app is running as an installed PWA (standalone display
 * mode). Used to drop URL-bar padding compensation and tweak chrome.
 */
export function useIsStandalone(): boolean {
  return useMediaQuery("(display-mode: standalone)");
}
