"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Plus, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY_DISMISSED = "thesvg-a2hs-dismissed";
const STORAGE_KEY_SESSIONS = "thesvg-a2hs-sessions";
const SHOW_AFTER_SESSIONS = 2;

type Mode = "hidden" | "prompt" | "ios";

// iOS Safari never fires `beforeinstallprompt`, so we route iOS to a
// custom Share -> Add to Home Screen card instead.
export function PwaInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<Mode>("hidden");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (localStorage.getItem(STORAGE_KEY_DISMISSED) === "1") return;

    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    const sessions = raw ? Number.parseInt(raw, 10) : 0;
    const next = Number.isFinite(sessions) ? sessions + 1 : 1;
    localStorage.setItem(STORAGE_KEY_SESSIONS, String(next));

    const ua = window.navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Mac") && "ontouchend" in document);
    const isSafari =
      /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);

    if (isIOS && isSafari && next >= SHOW_AFTER_SESSIONS) {
      setMode("ios");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setEvent(prompt);
      if (next >= SHOW_AFTER_SESSIONS) setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handler as EventListener,
      );
  }, []);

  const dismiss = useCallback(() => {
    setMode("hidden");
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
        setMode("hidden");
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_DISMISSED, "1");
        }
      }
    } catch {
      // User closed the system prompt; leave the card up to try again.
    }
  }, [event]);

  if (mode === "hidden") return null;

  if (mode === "ios") {
    return (
      <div
        role="region"
        aria-label="Install thesvg on iOS"
        className="fixed inset-x-3 z-40 mx-auto flex max-w-sm flex-col gap-2 rounded-2xl border border-border/60 bg-background px-3.5 py-3 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.5),0_2px_8px_-2px_rgba(0,0,0,0.3)] sm:right-6 sm:left-auto sm:max-w-xs dark:border-white/[0.1] dark:bg-[#0f0f10]"
        style={{
          bottom: "calc(var(--dock-height) + var(--safe-bottom) + 16px)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <Download className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Install on iPhone
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Tap{" "}
              <Share className="inline h-3 w-3 -translate-y-px text-blue-500" />{" "}
              Share, then{" "}
              <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                <Plus className="h-3 w-3" />
                Add to Home Screen
              </span>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Install thesvg"
      className="fixed inset-x-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border/60 bg-background px-3 py-2.5 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.5),0_2px_8px_-2px_rgba(0,0,0,0.3)] sm:right-6 sm:left-auto sm:max-w-sm dark:border-white/[0.1] dark:bg-[#0f0f10]"
      style={{
        bottom: "calc(var(--dock-height) + var(--safe-bottom) + 16px)",
      }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
        <Download className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Install thesvg</p>
        <p className="truncate text-[11px] text-muted-foreground">
          One tap to install as an app on this device.
        </p>
      </div>
      <button
        type="button"
        onClick={install}
        className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
