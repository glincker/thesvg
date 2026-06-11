"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MobileTopBar } from "./mobile-top-bar";
import { MobileBottomDock } from "./mobile-bottom-dock";
import { MobileSearchSheet } from "./mobile-search-sheet";
import { MobileIconSheet } from "./mobile-icon-sheet";
import { MobileMoreSheet } from "./mobile-more-sheet";
import { MobileActionSheet } from "./mobile-action-sheet";
import { PwaInstallPrompt } from "./pwa-install-prompt";
import { useIsMobileShell } from "@/lib/hooks/use-media-query";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";

const LONG_PRESS_MS = 500;
const PULL_DOWN_PX = 80;

/**
 * Glue layer for the Catalog 2026 mobile shell.
 *
 * Responsibilities:
 *   1. Render the mobile top bar + bottom dock (both `lg:hidden`).
 *   2. Wire the four sheets — search, icon, more, action.
 *   3. Intercept `<a href="/icon/...">` taps on mobile and open the
 *      icon sheet inline instead of full-page navigation. Direct deep
 *      links still hit the static `/icon/[slug]` route.
 *   4. Detect pull-down past 80px overscroll at the top of the page
 *      and open the search sheet at peek.
 *   5. Wire long-press (>500ms) on tiles to open the action sheet.
 *   6. Honor `?action=search` from the PWA shortcut by opening the
 *      search sheet on first mount.
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobileShell();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openSearch = useMobileShellStore((s) => s.openSearch);
  const openIcon = useMobileShellStore((s) => s.openIcon);
  const openAction = useMobileShellStore((s) => s.openAction);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);

  // Honor `?action=search` from the PWA shortcut.
  const hasHandledShortcutRef = useRef(false);
  useEffect(() => {
    if (hasHandledShortcutRef.current) return;
    if (searchParams.get("action") === "search") {
      hasHandledShortcutRef.current = true;
      openSearch("peek");
    }
  }, [searchParams, openSearch]);

  // Close any open sheet on route change so navigation feels clean.
  useEffect(() => {
    closeSheet();
  }, [pathname, closeSheet]);

  // Intercept icon tile taps for in-place sheet opening. Only on mobile.
  useEffect(() => {
    if (!isMobile) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Modifier keys → respect default (open in new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Walk up to the nearest anchor
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/icon/")) return;
      // Skip if the anchor is inside a sheet (already in sheet context)
      if (anchor.closest("[role='dialog']")) return;
      const slug = href.replace("/icon/", "").split(/[?#]/)[0];
      if (!slug) return;
      e.preventDefault();
      openIcon(slug);
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, [isMobile, openIcon]);

  // Long-press → action sheet on icon tiles. Uses pointerdown/up timing.
  useEffect(() => {
    if (!isMobile) return;
    let pressTimer: number | null = null;
    let pressedSlug: string | null = null;
    let suppressClick = false;

    function findSlug(target: EventTarget | null): string | null {
      if (!(target instanceof HTMLElement)) return null;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      const href = anchor?.getAttribute("href");
      if (!href || !href.startsWith("/icon/")) return null;
      return href.replace("/icon/", "").split(/[?#]/)[0] || null;
    }

    function onPointerDown(e: PointerEvent) {
      // Touch / pen only — mouse retains the click-to-open behavior.
      if (e.pointerType === "mouse") return;
      const slug = findSlug(e.target);
      if (!slug) return;
      pressedSlug = slug;
      pressTimer = window.setTimeout(() => {
        suppressClick = true;
        if (pressedSlug) openAction(pressedSlug);
        pressedSlug = null;
        pressTimer = null;
      }, LONG_PRESS_MS);
    }

    function clearPress() {
      if (pressTimer) {
        window.clearTimeout(pressTimer);
        pressTimer = null;
      }
      pressedSlug = null;
    }

    function onPointerUp() {
      clearPress();
    }
    function onPointerCancel() {
      clearPress();
    }
    function onPointerMove(e: PointerEvent) {
      // Cancel long-press on movement >8px (scroll intent).
      if (!pressTimer) return;
      if (Math.abs(e.movementY) + Math.abs(e.movementX) > 8) clearPress();
    }
    function onClick(e: MouseEvent) {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("click", onClick, { capture: true });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
    };
  }, [isMobile, openAction]);

  // Pull-down search — when the user overscrolls the top of the page
  // past 80px, open the search sheet at peek.
  useEffect(() => {
    if (!isMobile) return;
    let startY: number | null = null;
    let pulling = false;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      startY = e.touches[0].clientY;
      pulling = true;
    }
    function onTouchMove(e: TouchEvent) {
      if (!pulling || startY == null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > PULL_DOWN_PX) {
        pulling = false;
        startY = null;
        openSearch("peek");
      }
    }
    function onTouchEnd() {
      pulling = false;
      startY = null;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, openSearch]);

  return (
    <>
      {/* Mobile chrome — replaced for `lg:` users by the desktop Header below. */}
      <div className="contents lg:hidden">
        <MobileTopBar />
      </div>

      <div className="mobile-shell-body lg:[&]:!pb-0">{children}</div>

      <div className="contents lg:hidden">
        <MobileBottomDock />
        <MobileSearchSheet />
        <MobileIconSheet />
        <MobileMoreSheet />
        <MobileActionSheet />
        <PwaInstallPrompt />
      </div>
    </>
  );
}
