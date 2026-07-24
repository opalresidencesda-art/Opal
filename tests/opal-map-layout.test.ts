import { describe, expect, it } from "vitest";
import { mapStatus, searchProperties, streetForGang, unplacedProperties, type PropertyMapSummary } from "../src/lib/opal-map-layout";
import { shouldZoomMapFromWheel } from "../src/lib/opal-map-gesture";

const emptyProperty: PropertyMapSummary = {
  id: "property-id", unitCode: "OP 2 - 62", gang: 2, houseNumber: "62", occupancyStatus: null, active: true, accessLinkActive: false,
  position: null, profile: null, latestSubmission: null, contributions: [], requests: [],
};

describe("OPAL Atlas layout", () => {
  it("maps database gangs to the real Delima Selatan street labels", () => {
    expect(streetForGang(1).name).toBe("Jl. Delima Selatan I");
    expect(streetForGang(5).shortName).toBe("DS V");
  });

  it("prioritizes vacant and operational follow-up states", () => {
    expect(mapStatus({ ...emptyProperty, occupancyStatus: "vacant_sale" })).toBe("vacant");
    expect(mapStatus({ ...emptyProperty, contributions: [{ status: "pending", period: "2026-07-01", amountRupiah: 25_000, paidAt: null }] })).toBe("attention");
    expect(mapStatus({ ...emptyProperty, profile: { responsibleName: "Naufal", responsibleAddress: "OPAL", whatsapp: "08123456789", headOfHouseholdName: "Naufal", headOfHouseholdOccupation: "employee", occupantsCount: 3, contactEmail: "a@b.com", updatedAt: "2026-07-01" } })).toBe("verified");
  });

  it("keeps only homes without a calibrated coordinate unplaced", () => {
    expect(unplacedProperties([{ ...emptyProperty, unitCode: "OP 2 - 999" }])).toHaveLength(1);
    expect(unplacedProperties([{ ...emptyProperty, position: { latitude: -7.35, longitude: 112.78, calibratedAt: "2026-07-24", calibratedBy: "rt@opal.id" } }])).toHaveLength(0);
  });

  it("finds candidates by number, street shorthand, unit code, and responsible name", () => {
    const properties = [
      { ...emptyProperty, id: "one", unitCode: "OP 1 - 14", gang: 1, houseNumber: "14", profile: { responsibleName: "Naufal Purnomo", responsibleAddress: "OPAL", whatsapp: "08123456789", headOfHouseholdName: "Naufal", headOfHouseholdOccupation: "employee", occupantsCount: 3, contactEmail: "n@opal.id", updatedAt: "2026-07-24" } },
      { ...emptyProperty, id: "two", unitCode: "OP 2 - 14", gang: 2, houseNumber: "14" },
    ];
    expect(searchProperties(properties, "14")).toHaveLength(2);
    expect(searchProperties(properties, "DS II 14")[0]?.id).toBe("two");
    expect(searchProperties(properties, "OP 1 - 14")[0]?.id).toBe("one");
    expect(searchProperties(properties, "Naufal")[0]?.id).toBe("one");
  });

  it("only treats Ctrl or Command wheel inside the map as a zoom gesture", () => {
    expect(shouldZoomMapFromWheel({ ctrlKey: false, metaKey: false })).toBe(false);
    expect(shouldZoomMapFromWheel({ ctrlKey: true, metaKey: false })).toBe(true);
    expect(shouldZoomMapFromWheel({ ctrlKey: false, metaKey: true })).toBe(true);
  });
});
