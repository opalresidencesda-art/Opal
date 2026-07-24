export const OPAL_ATLAS_CENTER = { lat: -7.3536828, lng: 112.781988 } as const;
export const OPAL_ATLAS_DEFAULT_ZOOM = 19;
export const OPAL_ATLAS_MAX_ZOOM = 19;
export const OPAL_ATLAS_MIN_ZOOM = 17;

/**
 * Atlas is a fixed site plan. It deliberately lives in code rather than in
 * resident data: every physical unit remains discoverable before its family
 * record has been imported. Coordinates are local to the OPAL site plan and
 * can be adjusted here if the physical layout changes.
 */
export const OPAL_MAP_VIEWBOX = { width: 1600, height: 920 } as const;

export type MapSlot = {
  id: string;
  unitCode: string;
  gang: 1 | 2 | 3 | 5;
  houseNumber: string;
  side: "west" | "east";
  x: number;
  y: number;
  width: number;
  height: number;
};

type MapRoad = {
  gang: 1 | 2 | 3 | 5;
  label: string;
  start: readonly [number, number];
  end: readonly [number, number];
};

/** Roads, green edges, labels, and house slots for the four OPAL rows. */
export const OPAL_MAP_LAYOUT = {
  roads: [
    { gang: 1, label: "Gang 1 · Jl. Delima Selatan I", start: [224, 132], end: [1350, 268] },
    { gang: 2, label: "Gang 2 · Jl. Delima Selatan II", start: [184, 294], end: [1312, 430] },
    { gang: 3, label: "Gang 3 · Jl. Delima Selatan III", start: [144, 456], end: [1272, 592] },
    { gang: 5, label: "Gang 5 · Jl. Delima Selatan V", start: [106, 618], end: [1234, 754] },
  ] satisfies MapRoad[],
  greenSpaces: [
    { id: "north-edge", x: 88, y: 70, width: 1390, height: 36 },
    { id: "south-edge", x: 52, y: 810, width: 1328, height: 42 },
    { id: "east-garden", x: 1400, y: 268, width: 86, height: 390 },
  ],
} as const;

const HOUSES_PER_GANG = 80;
const HOUSE_WIDTH = 20;
const HOUSE_HEIGHT = 13;

export const OPAL_MAP_SLOTS: MapSlot[] = OPAL_MAP_LAYOUT.roads.flatMap((road) =>
  Array.from({ length: HOUSES_PER_GANG }, (_, index) => {
    const side = index < HOUSES_PER_GANG / 2 ? "west" : "east" as const;
    const number = String(index + 1);
    const t = ((index % (HOUSES_PER_GANG / 2)) + 0.5) / (HOUSES_PER_GANG / 2);
    const x = road.start[0] + (road.end[0] - road.start[0]) * t;
    const y = road.start[1] + (road.end[1] - road.start[1]) * t;
    const offset = side === "west" ? -22 : 22;
    return {
      id: `gang-${road.gang}-${number}`,
      unitCode: `OP ${road.gang} - ${number}`,
      gang: road.gang,
      houseNumber: number,
      side,
      x: x - HOUSE_WIDTH / 2,
      y: y + offset - HOUSE_HEIGHT / 2,
      width: HOUSE_WIDTH,
      height: HOUSE_HEIGHT,
    };
  }),
);

/** Converts the fixed plan geometry into the local, real-world map overlay. */
export function slotCoordinate(slot: Pick<MapSlot, "x" | "y" | "width" | "height">) {
  const centerX = slot.x + slot.width / 2;
  const centerY = slot.y + slot.height / 2;
  const normalizedX = (centerX - OPAL_MAP_VIEWBOX.width / 2) / OPAL_MAP_VIEWBOX.width;
  const normalizedY = (centerY - OPAL_MAP_VIEWBOX.height / 2) / OPAL_MAP_VIEWBOX.height;
  return {
    latitude: OPAL_ATLAS_CENTER.lat - normalizedY * 0.0022,
    longitude: OPAL_ATLAS_CENTER.lng + normalizedX * 0.003,
  };
}

export function propertyMatchesSlot(property: Pick<PropertyMapSummary, "gang" | "houseNumber">, slot: Pick<MapSlot, "gang" | "houseNumber">) {
  return property.gang === slot.gang && Number(property.houseNumber) === Number(slot.houseNumber);
}

export function searchMapSlots(rawQuery: string) {
  const query = rawQuery.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!query) return [];
  const words = query.split(" ").filter(Boolean);
  const romanGang: Record<string, number> = { i: 1, ii: 2, iii: 3, v: 5 };
  const requestedGang = words.find((word) => ["1", "2", "3", "5", "i", "ii", "iii", "v"].includes(word));
  const gang = requestedGang ? romanGang[requestedGang] ?? Number(requestedGang) : undefined;
  const requestedNumber = words.filter((word) => /^\d{1,3}$/.test(word)).find((word) => !gang || Number(word) !== gang) ?? (gang ? undefined : words.find((word) => /^\d{1,3}$/.test(word)));
  if (!requestedNumber && !gang) return [];
  return OPAL_MAP_SLOTS.filter((slot) => (!requestedNumber || Number(slot.houseNumber) === Number(requestedNumber)) && (!gang || slot.gang === gang)).slice(0, 12);
}

export const OPAL_STREETS = [
  { gang: 1, name: "Jl. Delima Selatan I", shortName: "DS I" },
  { gang: 2, name: "Jl. Delima Selatan II", shortName: "DS II" },
  { gang: 3, name: "Jl. Delima Selatan III", shortName: "DS III" },
  { gang: 5, name: "Jl. Delima Selatan V", shortName: "DS V" },
] as const;

export type PropertyMapStatus = "verified" | "attention" | "missing" | "vacant";

export type PropertyMapPosition = {
  latitude: number;
  longitude: number;
  calibratedAt: string;
  calibratedBy: string;
};

export type PropertyMapSummary = {
  id: string;
  unitCode: string;
  gang: number;
  houseNumber: string;
  occupancyStatus: string | null;
  active: boolean;
  accessLinkActive: boolean;
  position: PropertyMapPosition | null;
  profile: {
    responsibleName: string;
    responsibleAddress: string;
    whatsapp: string;
    headOfHouseholdName: string;
    headOfHouseholdOccupation: string;
    occupantsCount: number;
    contactEmail: string;
    updatedAt: string;
  } | null;
  latestSubmission: {
    id: string;
    status: string;
    createdAt: string;
    evidence: Array<{ id: string; evidenceKind: string; originalName: string }>;
  } | null;
  contributions: Array<{ status: "paid" | "pending" | "waived"; period: string | null; amountRupiah: number; paidAt: string | null }>;
  requests: Array<{ id: string; requestType: "move" | "domicile" | "single"; status: string; createdAt: string }>;
};

export function streetForGang(gang: number) {
  return OPAL_STREETS.find((street) => street.gang === gang) ?? { gang, name: `Gang ${gang}`, shortName: `Gang ${gang}` };
}

export function mapStatus(property: Pick<PropertyMapSummary, "occupancyStatus" | "profile" | "latestSubmission" | "contributions">): PropertyMapStatus {
  if (property.occupancyStatus === "vacant_rent" || property.occupancyStatus === "vacant_sale") return "vacant";
  if (property.latestSubmission && ["submitted", "in_review", "needs_revision"].includes(property.latestSubmission.status)) return "attention";
  if (property.contributions.some((contribution) => contribution.status === "pending")) return "attention";
  return property.profile ? "verified" : "missing";
}

export function unplacedProperties(properties: PropertyMapSummary[]) {
  return properties.filter((property) => !property.position);
}

function normalise(value: string) {
  return value.toLowerCase().replace(/jalan|jl\.?|delima|selatan|opal|residence/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

export function searchProperties(properties: PropertyMapSummary[], rawQuery: string) {
  const query = normalise(rawQuery);
  if (!query) return [];
  const words = query.split(" ").filter(Boolean);
  const requestedNumber = words.find((word) => /^\d{1,3}$/.test(word));
  const requestedGang = words.find((word) => ["1", "2", "3", "5", "i", "ii", "iii", "v"].includes(word));
  const romanGang: Record<string, number> = { i: 1, ii: 2, iii: 3, v: 5 };
  const gang = requestedGang ? romanGang[requestedGang] ?? Number(requestedGang) : undefined;

  return properties
    .map((property) => {
      const haystack = normalise(`${property.unitCode} ${property.houseNumber} ${property.profile?.responsibleName ?? ""} ${streetForGang(property.gang).name}`);
      const numberMatch = !requestedNumber || property.houseNumber.replace(/^0+/, "") === requestedNumber.replace(/^0+/, "");
      const gangMatch = !gang || property.gang === gang;
      const wordsMatch = words.every((word) => haystack.includes(word) || romanGang[word] === property.gang);
      const score = (numberMatch ? 4 : 0) + (gangMatch ? 3 : 0) + (wordsMatch ? 2 : 0) + (haystack.includes(query) ? 2 : 0);
      return { property, score, matches: (requestedNumber ? numberMatch : wordsMatch) && gangMatch };
    })
    .filter((item) => item.matches || item.score >= 4)
    .sort((left, right) => right.score - left.score || left.property.gang - right.property.gang || Number(left.property.houseNumber) - Number(right.property.houseNumber))
    .map((item) => item.property)
    .slice(0, 8);
}

export function streetRanges(properties: PropertyMapSummary[]) {
  return OPAL_STREETS.map((street) => {
    const numbers = properties.filter((property) => property.gang === street.gang && property.position).map((property) => Number(property.houseNumber)).filter(Number.isFinite).sort((a, b) => a - b);
    return numbers.length ? { ...street, label: `${String(numbers[0]).padStart(2, "0")}–${String(numbers[numbers.length - 1]).padStart(2, "0")}` } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
}
