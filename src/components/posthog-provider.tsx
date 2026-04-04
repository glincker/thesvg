"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

let initialized = false;

export function PostHogProvider() {
  useEffect(() => {
    if (initialized || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    initialized = true;

    const shouldIgnore =
      document.cookie.includes("thesvg_ignore_analytics=true");

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com",
      capture_exceptions: !shouldIgnore,
      debug: process.env.NODE_ENV === "development",
    });

    if (shouldIgnore) {
      posthog.opt_out_capturing();
    }
  }, []);

  return null;
}
