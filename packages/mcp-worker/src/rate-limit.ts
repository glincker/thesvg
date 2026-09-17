// Per-IP sliding-window rate limiting, checked before any tool executes.
//
// Uses Cloudflare's native Rate Limiting binding
// (https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
// rather than an external service like Upstash: it's a first-party Workers
// primitive (no extra network hop, no third-party credentials to provision),
// which is the more idiomatic choice given this Worker already runs on
// Cloudflare. The binding requires a `namespace_id` that's unique per
// Cloudflare account, which cannot be minted without a real account, so
// wrangler.jsonc ships the binding commented out and this module is written
// to no-op (allow all requests) whenever the binding isn't present or
// throws. The project owner enables real limiting by uncommenting the
// binding, deploying, and letting Cloudflare provision a namespace_id.

export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface RateLimitEnv {
  RATE_LIMITER?: RateLimitBinding;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: "no-binding" | "under-limit" | "over-limit" | "check-failed";
}

/**
 * Checks the per-IP rate limit. Fails open (allows the request) whenever the
 * binding is missing or the binding call itself throws, so a
 * misconfigured/unprovisioned environment never breaks the server -- it just
 * runs without rate limiting.
 */
export async function checkRateLimit(
  env: RateLimitEnv,
  clientKey: string
): Promise<RateLimitResult> {
  const binding = env.RATE_LIMITER;
  if (!binding) {
    return { allowed: true, reason: "no-binding" };
  }

  try {
    const outcome = await binding.limit({ key: clientKey });
    return outcome.success
      ? { allowed: true, reason: "under-limit" }
      : { allowed: false, reason: "over-limit" };
  } catch (err) {
    console.error("[rate-limit] binding.limit() failed, allowing request:", err);
    return { allowed: true, reason: "check-failed" };
  }
}

/** Extracts a per-client key from a Request. Cloudflare-specific header first, generic fallback second. */
export function clientKeyFromRequest(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
