"use client";

import { useEffect } from "react";
import { capture, captureException } from "@/lib/analytics";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[thesvg] Global error:", error);
    captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#fafafa" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Something went wrong</h2>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>An unexpected error occurred.</p>
          <button
            onClick={reset}
            type="button"
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #27272a", background: "transparent", color: "#fafafa", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
