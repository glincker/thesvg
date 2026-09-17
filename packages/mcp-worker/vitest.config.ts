import { defineConfig } from "vitest/config";

// Plain vitest against extracted pure functions (search ranking, variant
// listing, category counts, URL construction, rate-limit no-op behavior).
// No @cloudflare/vitest-pool-workers here: none of the tested code touches
// Workers-runtime-specific behavior (the fetch handler itself is a thin
// wrapper around createMcpHandler + these already-tested functions), so the
// simpler plain-Node vitest pool is sufficient.
export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
