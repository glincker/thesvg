import type { CaptureResult, PostHog, Properties } from "posthog-js";

const shouldIgnore =
  typeof document !== "undefined" &&
  document.cookie.includes("thesvg_ignore_analytics=true");

// Local development runs against the production PostHog project. Without this
// guard, anything a developer breaks on their machine (a throw in a dev build,
// a half-finished component) is captured as if a real user hit it in
// production, so dev-only crashes pollute error tracking. Skip capture when the
// app runs on a developer's machine.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];

const isLocalEnvironment =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" &&
    LOCAL_HOSTS.includes(window.location.hostname));

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Meta in-app browsers (Instagram, Threads, Facebook) inject their own native
// bridge script into every page they open. That script throws when it calls
// back to the host app, and posthog-js captures the throw even though the site
// has no such bridge. One marker covers the Android "postMessage" family and
// the iOS "webkit.messageHandlers" family, so new fingerprints stay filtered.
const IN_APP_BROWSER_BRIDGE_MARKERS = [
  "invoking postMessage",
  "webkit.messageHandlers",
];

function isInAppBrowserBridgeError(result: CaptureResult): boolean {
  if (result.event !== "$exception") return false;

  const exceptions = result.properties?.["$exception_list"];
  if (!Array.isArray(exceptions)) return false;

  return exceptions.some((exception: { value?: unknown }) => {
    const value = exception?.value;
    return (
      typeof value === "string" &&
      IN_APP_BROWSER_BRIDGE_MARKERS.some((marker) => value.includes(marker))
    );
  });
}

// The browser raises a "ResizeObserver loop" warning on window.onerror when it
// cannot finish all resize callbacks in one frame. posthog-js captures it as a
// synthetic, frameless exception even though nothing in the app threw and the
// user flow keeps working. One marker covers both the legacy Chrome wording
// ("loop limit exceeded") and the modern wording ("loop completed with
// undelivered notifications").
const RESIZE_OBSERVER_MARKER = "ResizeObserver loop";

function isResizeObserverLoopError(result: CaptureResult): boolean {
  if (result.event !== "$exception") return false;

  const exceptions = result.properties?.["$exception_list"];
  if (!Array.isArray(exceptions)) return false;

  return exceptions.some((exception: { value?: unknown }) => {
    const value = exception?.value;
    return typeof value === "string" && value.includes(RESIZE_OBSERVER_MARKER);
  });
}

const enabled = Boolean(posthogKey) && !isLocalEnvironment;

// posthog-js is large, so it loads after the page is up instead of with the
// first bundle. Events fired earlier wait on the same promise, so none are lost.
let client: Promise<PostHog | null> | null = null;

function loadClient(): Promise<PostHog | null> {
  if (!enabled || !posthogKey) return Promise.resolve(null);
  client ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: !shouldIgnore,
      before_send: (result) => {
        if (result && isInAppBrowserBridgeError(result)) return null;
        if (result && isResizeObserverLoopError(result)) return null;
        return result;
      },
      debug: process.env.NODE_ENV === "development",
    });
    if (shouldIgnore) posthog.opt_out_capturing();
    return posthog;
  });
  return client;
}

/** Starts analytics once the page has loaded and the browser is idle. */
export function scheduleAnalytics(): void {
  if (!enabled || typeof window === "undefined") return;
  const start = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => void loadClient(), { timeout: 4000 });
    else setTimeout(() => void loadClient(), 2000);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

export function capture(event: string, properties?: Properties): void {
  void loadClient().then((ph) => ph?.capture(event, properties));
}

export function captureException(error: unknown, properties?: Properties): void {
  void loadClient().then((ph) => ph?.captureException(error, properties));
}
