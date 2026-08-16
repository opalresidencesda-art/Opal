import { describe, expect, it } from "vitest";
import { mapStatus, OPAL_ATLAS_DEFAULT_ZOOM, OPAL_ATLAS_MAX_ZOOM, OPAL_ATLAS_MIN_ZOOM, OPAL_MAP_LAYOUT, OPAL_MAP_SLOTS, propertyMatchesSlot, searchMapSlots, searchProperties, streetForGang, unplacedProperties, type PropertyMapSummary } from "../src/lib/opal-map-layout";
import { shouldSetPropertyPosition, shouldZoomMapFromWheel } from "../src/lib/opal-map-gesture";

const emptyProperty: PropertyMapSummary = {
  id: "property-id", unitCode: "OP 2 - 62", gang: 2, houseNumber: "62", occupancyStatus: null, active: true, accessLinkActive: false,
  position: null, profile: null, latestSubmission: null, contributions: [], requests: [],
};

describe("OPAL Atlas layout", () => {
  it("maps database gangs to the real Delima Selatan street labels", () => {
    expect(streetForGang(1).name).toBe("Jl. Delima Selatan I");
    expect(streetForGang(5).shortName).toBe("DS V");
  });

  it("keeps every OPAL road and fixed house slot available before resident import", () => {
    expect(OPAL_MAP_LAYOUT.roads.map((road) => road.gang)).toEqual([1, 2, 3, 5]);
    expect(OPAL_MAP_SLOTS).toHaveLength(344);
    expect(new Set(OPAL_MAP_SLOTS.map((slot) => slot.id)).size).toBe(OPAL_MAP_SLOTS.length);
    expect(OPAL_MAP_SLOTS.filter((slot) => slot.gang === 5 && slot.houseNumber === "14")).toHaveLength(1);
    expect(OPAL_MAP_SLOTS.filter((slot) => slot.gang === 5 && slot.houseNumber === "86")).toHaveLength(1);
  });

  it("numbers both sides of every gang from right to left", () => {
    const slot = (gang: number, houseNumber: string) => OPAL_MAP_SLOTS.find((item) => item.gang === gang && item.houseNumber === houseNumber)!;

    for (const gang of [1, 2, 3, 5]) {
      expect(slot(gang, "1").x).toBeGreaterThan(slot(gang, "43").x);
      expect(slot(gang, "44").x).toBeGreaterThan(slot(gang, "86").x);
    }
  });

  it("finds static units and matches padded database house numbers", () => {
    const slot = OPAL_MAP_SLOTS.find((item) => item.gang === 2 && item.houseNumber === "14")!;
    expect(searchMapSlots("DS II 14")[0]?.id).toBe(slot.id);
    expect(propertyMatchesSlot({ ...emptyProperty, gang: 2, houseNumber: "014" }, slot)).toBe(true);
  });

  it("keeps the live map within the detail level provided by its raster sources", () => {
    expect(OPAL_ATLAS_MIN_ZOOM).toBeLessThan(OPAL_ATLAS_DEFAULT_ZOOM);
    expect(OPAL_ATLAS_DEFAULT_ZOOM).toBeLessThanOrEqual(OPAL_ATLAS_MAX_ZOOM);
    expect(OPAL_ATLAS_MAX_ZOOM).toBe(19);
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

  it("ignores ordinary map clicks and only captures a point for an explicitly selected house", () => {
    expect(shouldSetPropertyPosition(false, null)).toBe(false);
    expect(shouldSetPropertyPosition(true, null)).toBe(false);
    expect(shouldSetPropertyPosition(true, "property-id")).toBe(true);
  });
});
