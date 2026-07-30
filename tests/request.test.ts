import { describe, expect, it } from "vitest";
import { consumeRequestRateLimit, readJsonBody, requestBodyExceeds, requestHasJsonContentType, requestHasSameOrigin } from "../src/lib/request";

describe("requestBodyExceeds", () => {
  it("rejects a declared body larger than the route budget", () => {
    expect(requestBodyExceeds(new Request("http://opal.test", { headers: { "content-length": "65537" } }), 65536)).toBe(true);
    expect(requestBodyExceeds(new Request("http://opal.test", { headers: { "content-length": "65536" } }), 65536)).toBe(false);
  });

  it("allows chunked requests to reach schema validation", () => {
    expect(requestBodyExceeds(new Request("http://opal.test"), 65536)).toBe(false);
  });
});

describe("requestHasJsonContentType", () => {
  it("accepts application/json with or without charset", () => {
    expect(requestHasJsonContentType(new Request("http://opal.test", { headers: { "content-type": "application/json" } }))).toBe(true);
    expect(requestHasJsonContentType(new Request("http://opal.test", { headers: { "content-type": "application/json; charset=utf-8" } }))).toBe(true);
  });

  it("rejects missing or mismatched content types", () => {
    expect(requestHasJsonContentType(new Request("http://opal.test"))).toBe(false);
    expect(requestHasJsonContentType(new Request("http://opal.test", { headers: { "content-type": "text/plain" } }))).toBe(false);
  });
});

describe("readJsonBody", () => {
  it("returns parsed JSON when the body is valid", async () => {
    await expect(readJsonBody(new Request("http://opal.test", { body: JSON.stringify({ ok: true }), method: "POST", headers: { "content-type": "application/json" } }))).resolves.toEqual({ ok: true });
  });

  it("returns null when the body is malformed", async () => {
    await expect(readJsonBody(new Request("http://opal.test", { body: "{", method: "POST", headers: { "content-type": "application/json" } }))).resolves.toBeNull();
  });
});

describe("request origin and abuse controls", () => {
  it("allows same-origin and rejects explicit cross-origin requests", () => {
    expect(requestHasSameOrigin(new Request("https://opal.test/api/surat", { headers: { origin: "https://opal.test" } }))).toBe(true);
    expect(requestHasSameOrigin(new Request("https://opal.test/api/surat", { headers: { origin: "https://evil.test" } }))).toBe(false);
    expect(requestHasSameOrigin(new Request("https://opal.test/api/surat"))).toBe(true);
  });

  it("enforces a bounded per-route request bucket", () => {
    const first = consumeRequestRateLimit(new Request("https://opal.test", { headers: { "x-forwarded-for": "198.51.100.22" } }), "test-bucket", 2, 60_000);
    const second = consumeRequestRateLimit(new Request("https://opal.test", { headers: { "x-forwarded-for": "198.51.100.22" } }), "test-bucket", 2, 60_000);
    const third = consumeRequestRateLimit(new Request("https://opal.test", { headers: { "x-forwarded-for": "198.51.100.22" } }), "test-bucket", 2, 60_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfter).toBeGreaterThan(0);
  });
});
