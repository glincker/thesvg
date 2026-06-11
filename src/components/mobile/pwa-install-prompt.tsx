"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY_DISMISSED = "thesvg-a2hs-dismissed";
const STORAGE_KEY_SESSIONS = "thesvg-a2hs-sessions";
const SHOW_AFTER_SESSIONS = 2;

/**
 * Add-to-home-screen prompt. Shows only when:
 *   - The browser fired `beforeinstallprompt` (i.e. PWA install is supported)
 *   - The user has opened the site at least `SHOW_AFTER_SESSIONS` times
 *   - The user has not already dismissed it
 *   - The app is not already running standalone
 *
 * Persists dismissal in localStorage. Counter resets on no-op so it
 * never reappears for users who declined.
 */
export function PwaInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Already installed — bail.
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;
    if (localStorage.getItem(STORAGE_KEY_DISMISSED) === "1") return;

    // Bump session counter
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    const sessions = raw ? Number.parseInt(raw, 10) : 0;
    const next = Number.isFinite(sessions) ? sessions + 1 : 1;
    localStorage.setItem(STORAGE_KEY_SESSIONS, String(next));

    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setEvent(prompt);
      if (next >= SHOW_AFTER_SESSIONS) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handler as EventListener,
      );
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_DISMISSED, "1");
    }
  }, []);

  const install = useCallback(async () => {
    if (!event) return;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_DISMISSED, "1");
        }
      }
    } catch {
      // user closed system prompt — leave banner up
    }
  }, [event]);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install thesvg"
      className="surface-glass fixed inset-x-3 z-40 flex items-center gap-3 rounded-2xl border border-border/40 px-3 py-2.5 shadow-lg lg:hidden dark:border-white/[0.06]"
      style={{
        bottom: "calc(var(--dock-height) + var(--safe-bottom) + 12px)",
      }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
        <Download className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          Install thesvg
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          Add to home screen for fullscreen access.
        </p>
      </div>
      <button
        type="button"
        onClick={install}
        className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
