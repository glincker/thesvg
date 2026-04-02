import posthog from "posthog-js";

// Allow internal users to opt out via cookie: thesvg_ignore_analytics=true
const shouldIgnore =
  typeof document !== "undefined" &&
  document.cookie.includes("thesvg_ignore_analytics=true");

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "https://us.i.posthog.com",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: !shouldIgnore,
  debug: process.env.NODE_ENV === "development",
});

if (shouldIgnore) {
  posthog.opt_out_capturing();
}
