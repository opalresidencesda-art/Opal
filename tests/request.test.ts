import { describe, expect, it } from "vitest";
import { requestBodyExceeds } from "../src/lib/request";

describe("requestBodyExceeds", () => {
  it("rejects a declared body larger than the route budget", () => {
    expect(requestBodyExceeds(new Request("http://opal.test", { headers: { "content-length": "65537" } }), 65536)).toBe(true);
    expect(requestBodyExceeds(new Request("http://opal.test", { headers: { "content-length": "65536" } }), 65536)).toBe(false);
  });

  it("allows chunked requests to reach schema validation", () => {
    expect(requestBodyExceeds(new Request("http://opal.test"), 65536)).toBe(false);
  });
});
