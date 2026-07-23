import { describe, expect, it } from "vitest";
import { OPAL_MAP_SLOTS, mapStatus, unplacedProperties, type PropertyMapSummary } from "../src/lib/opal-map-layout";

const emptyProperty: PropertyMapSummary = {
  id: "property-id", unitCode: "OP 2 - 62", gang: 2, houseNumber: "62", occupancyStatus: null, active: true, accessLinkActive: false,
  profile: null, latestSubmission: null, contributions: [], requests: [],
};

describe("OPAL Atlas layout", () => {
  it("uses a unique slot for every mapped unit", () => {
    expect(new Set(OPAL_MAP_SLOTS.map((slot) => slot.unitCode)).size).toBe(OPAL_MAP_SLOTS.length);
    expect(OPAL_MAP_SLOTS.some((slot) => slot.unitCode === "OP 2 - 62")).toBe(true);
  });

  it("prioritizes vacant and operational follow-up states", () => {
    expect(mapStatus({ ...emptyProperty, occupancyStatus: "vacant_sale" })).toBe("vacant");
    expect(mapStatus({ ...emptyProperty, contributions: [{ status: "pending", period: "2026-07-01", amountRupiah: 25_000, paidAt: null }] })).toBe("attention");
    expect(mapStatus({ ...emptyProperty, profile: { responsibleName: "Naufal", responsibleAddress: "OPAL", whatsapp: "08123456789", headOfHouseholdName: "Naufal", headOfHouseholdOccupation: "employee", occupantsCount: 3, contactEmail: "a@b.com", updatedAt: "2026-07-01" } })).toBe("verified");
  });

  it("keeps properties without a matching architectural slot unplaced", () => {
    expect(unplacedProperties([{ ...emptyProperty, unitCode: "OP 2 - 999" }])).toHaveLength(1);
  });
});
