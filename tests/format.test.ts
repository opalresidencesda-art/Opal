import { describe, expect, it } from "vitest";
import { getActiveFees, formatRupiah } from "../src/lib/format";

describe("formatRupiah", () => {
  it("formats an integer amount in Indonesian rupiah", () => {
    expect(formatRupiah(245000).replace(/\s/g, "")).toBe("Rp245.000");
  });
});

describe("getActiveFees", () => {
  it("returns only active schedules, showing the newest effective schedule first", () => {
    const fees = getActiveFees([
      { label: "Zeta", amountRupiah: 2, paymentMethod: "x", destination: "", description: "", effectiveFrom: "2026-01-01", active: true },
      { label: "Arsip", amountRupiah: 1, paymentMethod: "x", destination: "", description: "", effectiveFrom: "2025-01-01", active: false },
      { label: "Alpha", amountRupiah: 3, paymentMethod: "x", destination: "", description: "", effectiveFrom: "2025-01-01", active: true },
    ]);
    expect(fees.map((fee) => fee.label)).toEqual(["Zeta", "Alpha"]);
  });
});
