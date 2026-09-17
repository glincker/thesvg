import { describe, it, expect, vi } from "vitest";
import { checkRateLimit, clientKeyFromRequest } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows all requests when no binding is configured (no-op default)", async () => {
    const result = await checkRateLimit({}, "1.2.3.4");
    expect(result).toEqual({ allowed: true, reason: "no-binding" });
  });

  it("allows the request when the binding reports success", async () => {
    const binding = { limit: vi.fn().mockResolvedValue({ success: true }) };
    const result = await checkRateLimit({ RATE_LIMITER: binding }, "1.2.3.4");
    expect(result).toEqual({ allowed: true, reason: "under-limit" });
    expect(binding.limit).toHaveBeenCalledWith({ key: "1.2.3.4" });
  });

  it("blocks the request when the binding reports failure", async () => {
    const binding = { limit: vi.fn().mockResolvedValue({ success: false }) };
    const result = await checkRateLimit({ RATE_LIMITER: binding }, "1.2.3.4");
    expect(result).toEqual({ allowed: false, reason: "over-limit" });
  });

  it("fails open when the binding call throws", async () => {
    const binding = { limit: vi.fn().mockRejectedValue(new Error("boom")) };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await checkRateLimit({ RATE_LIMITER: binding }, "1.2.3.4");
    expect(result).toEqual({ allowed: true, reason: "check-failed" });
    consoleSpy.mockRestore();
  });
});

describe("clientKeyFromRequest", () => {
  it("prefers cf-connecting-ip", () => {
    const req = new Request("https://example.com", {
      headers: { "cf-connecting-ip": "5.6.7.8", "x-forwarded-for": "9.9.9.9" },
    });
    expect(clientKeyFromRequest(req)).toBe("5.6.7.8");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "9.9.9.9, 1.1.1.1" },
    });
    expect(clientKeyFromRequest(req)).toBe("9.9.9.9");
  });

  it("falls back to 'unknown' when no IP header is present", () => {
    const req = new Request("https://example.com");
    expect(clientKeyFromRequest(req)).toBe("unknown");
  });
});
