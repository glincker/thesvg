"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MOBILE_FOCUS_SEARCH_EVENT, MobileTopBar } from "./mobile-top-bar";
import { MobileBottomDock } from "./mobile-bottom-dock";
import { MobileIconSheet } from "./mobile-icon-sheet";
import { MobileMoreSheet } from "./mobile-more-sheet";
import { MobileActionSheet } from "./mobile-action-sheet";
import { PwaInstallPrompt } from "./pwa-install-prompt";
import { useIsMobileShell } from "@/lib/hooks/use-media-query";
import { useMobileShellStore } from "@/lib/stores/mobile-shell-store";
import { useMobilePrefsStore } from "@/lib/stores/mobile-prefs-store";

const LONG_PRESS_MS = 500;
const PULL_DOWN_PX = 80;

/**
 * Mobile shell: top bar + dock + sheets. Renders below `lg`.
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobileShell();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openIcon = useMobileShellStore((s) => s.openIcon);
  const openAction = useMobileShellStore((s) => s.openAction);
  const closeSheet = useMobileShellStore((s) => s.closeSheet);

  const hasHandledShortcutRef = useRef(false);
  useEffect(() => {
    if (hasHandledShortcutRef.current) return;
    if (searchParams.get("action") === "search") {
      hasHandledShortcutRef.current = true;
      window.dispatchEvent(new Event(MOBILE_FOCUS_SEARCH_EVENT));
    }
  }, [searchParams]);

  useEffect(() => {
    closeSheet();
  }, [pathname, closeSheet]);

  useEffect(() => {
    if (!isMobile) return;
    function onClick(e: MouseEvent) {
      // Read at click time so toggling the pref takes effect without remount.
      const mode = useMobilePrefsStore.getState().iconOpenMode;
      if (mode === "page") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/icon/")) return;
      if (anchor.closest("[role='dialog']")) return;
      const slug = href.replace("/icon/", "").split(/[?#]/)[0];
      if (!slug) return;
      e.preventDefault();
      openIcon(slug);
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
  }, [isMobile, openIcon]);

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
        window.dispatchEvent(new Event(MOBILE_FOCUS_SEARCH_EVENT));
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
  }, [isMobile]);

  return (
    <>
      <div className="contents lg:hidden">
        <MobileTopBar />
      </div>

      <div className="mobile-shell-body lg:[&]:!pb-0">{children}</div>

      <div className="contents lg:hidden">
        <MobileBottomDock />
        <MobileIconSheet />
        <MobileMoreSheet />
        <MobileActionSheet />
        <PwaInstallPrompt />
      </div>
    </>
  );
}
