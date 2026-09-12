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

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: !shouldIgnore,
    before_send: (result) => {
      if (result && isInAppBrowserBridgeError(result)) return null;
      return result;
    },
    debug: process.env.NODE_ENV === "development",
  });

  if (shouldIgnore) {
    posthog.opt_out_capturing();
  }
}
