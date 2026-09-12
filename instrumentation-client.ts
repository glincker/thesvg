import posthog from "posthog-js";
import type { CaptureResult } from "posthog-js";

const shouldIgnore =
  typeof document !== "undefined" &&
  document.cookie.includes("thesvg_ignore_analytics=true");

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

// Injected third-party scripts (seen on Chrome iOS) run inline in the document,
// so an error they throw names the bare page URL in every stack frame. Code
// from this site is always served as Next.js chunks under /_next/static/, so a
// genuine site error carries at least one chunk frame. An unhandled exception
// whose frames all name the document URL, and never a chunk, is injected-script
// noise rather than our own bug.
const NEXT_CHUNK_MARKER = "/_next/static/";

type StackFrame = { filename?: unknown };
type ExceptionItem = {
  mechanism?: { handled?: unknown };
  stacktrace?: { frames?: unknown };
};

function isInjectedPageScriptError(result: CaptureResult): boolean {
  if (result.event !== "$exception") return false;
  if (typeof window === "undefined") return false;

  const exceptions = result.properties?.["$exception_list"];
  if (!Array.isArray(exceptions) || exceptions.length === 0) return false;

  const documentUrl = window.location.origin + window.location.pathname;

  return exceptions.every((exception: ExceptionItem) => {
    if (exception?.mechanism?.handled !== false) return false;

    const frames = exception?.stacktrace?.frames;
    if (!Array.isArray(frames) || frames.length === 0) return false;

    return frames.every((frame: StackFrame) => {
      const filename = frame?.filename;
      if (typeof filename !== "string") return false;
      if (filename.includes(NEXT_CHUNK_MARKER)) return false;
      return filename.split(/[?#]/)[0] === documentUrl;
    });
  });
}

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: !shouldIgnore,
    before_send: (result) => {
      if (!result) return result;
      if (isInAppBrowserBridgeError(result)) return null;
      if (isInjectedPageScriptError(result)) return null;
      return result;
    },
    debug: process.env.NODE_ENV === "development",
  });

  if (shouldIgnore) {
    posthog.opt_out_capturing();
  }
}
