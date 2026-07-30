import { describe, expect, it } from "vitest";
import { buildMonthlyDuesRows, summarizeMonthlyDues } from "../src/lib/monthly-dues";

describe("monthly dues ledger", () => {
  it("keeps unprepared periods separate from recorded arrears", () => {
    const rows = buildMonthlyDuesRows([
      { id: "rumah-a", unitCode: "OP 1 - 01", responsibleName: "Pak Adi" },
      { id: "rumah-b", unitCode: "OP 1 - 02", responsibleName: "Bu Bina" },
    ], [
      { id: "a-jun", propertyId: "rumah-a", period: "2026-06-01", amountRupiah: 25000, paidAt: null, status: "pending" },
      { id: "a-mei", propertyId: "rumah-a", period: "2026-05-01", amountRupiah: 25000, paidAt: "2026-05-12", status: "paid" },
      { id: "b-jun", propertyId: "rumah-b", period: "2026-06-01", amountRupiah: 25000, paidAt: "2026-06-05", status: "paid" },
    ], "2026-07");

    expect(rows[0]).toMatchObject({ unitCode: "OP 1 - 01", selectedStatus: "unprepared", lastPaidPeriod: "2026-05", outstandingAmount: 25000, outstandingPeriods: ["2026-06"] });
    expect(rows[1]).toMatchObject({ unitCode: "OP 1 - 02", selectedStatus: "unprepared", lastPaidPeriod: "2026-06", outstandingAmount: 0, outstandingPeriods: [] });
  });

  it("surfaces duplicate records as a correction state instead of marking them paid", () => {
    const rows = buildMonthlyDuesRows([{ id: "rumah-a", unitCode: "OP 1 - 01", responsibleName: "Pak Adi" }], [
      { id: "a-1", propertyId: "rumah-a", period: "2026-07-01", amountRupiah: 25000, paidAt: "2026-07-03", status: "paid" },
      { id: "a-2", propertyId: "rumah-a", period: "2026-07-01", amountRupiah: 25000, paidAt: null, status: "pending" },
    ], "2026-07");

    expect(rows[0]).toMatchObject({ selectedStatus: "attention", selectedContribution: null, outstandingAmount: 25000 });
    expect(summarizeMonthlyDues(rows)).toMatchObject({ attention: 1, outstandingHomes: 1, outstandingAmount: 25000 });
  });
});
