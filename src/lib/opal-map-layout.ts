export const OPAL_MAP_VIEWBOX = { width: 1_600, height: 920 } as const;

export type MapSlot = {
  unitCode: string;
  gang: 1 | 2 | 3 | 5;
  houseNumber: string;
  x: number;
  y: number;
  width: number;
  height: number;
  side: "west" | "east";
};

export type PropertyMapStatus = "verified" | "attention" | "missing" | "vacant";

export type PropertyMapSummary = {
  id: string;
  unitCode: string;
  gang: number;
  houseNumber: string;
  occupancyStatus: string | null;
  active: boolean;
  accessLinkActive: boolean;
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

const gangGeometry: Array<{ gang: 1 | 2 | 3 | 5; roadX: number }> = [
  { gang: 1, roadX: 220 },
  { gang: 2, roadX: 580 },
  { gang: 3, roadX: 940 },
  { gang: 5, roadX: 1_300 },
];

const housesPerGang = 80;
const houseWidth = 42;
const houseHeight = 13;
const rowGap = 5;
const firstHouseY = 126;

function unitCode(gang: number, houseNumber: string) {
  return `OP ${gang} - ${houseNumber}`;
}

export const OPAL_MAP_SLOTS: MapSlot[] = gangGeometry.flatMap(({ gang, roadX }) => Array.from({ length: housesPerGang }, (_, index) => {
  const side = index < housesPerGang / 2 ? "west" : "east" as const;
  const row = side === "west" ? index : index - housesPerGang / 2;
  const houseNumber = String(index + 1);

  return {
    unitCode: unitCode(gang, houseNumber),
    gang,
    houseNumber,
    x: side === "west" ? roadX - 72 : roadX + 30,
    y: firstHouseY + row * (houseHeight + rowGap),
    width: houseWidth,
    height: houseHeight,
    side,
  };
}));

export const OPAL_MAP_SLOT_BY_UNIT = new Map(OPAL_MAP_SLOTS.map((slot) => [slot.unitCode, slot]));

export function mapStatus(property: Pick<PropertyMapSummary, "occupancyStatus" | "profile" | "latestSubmission" | "contributions">): PropertyMapStatus {
  if (property.occupancyStatus === "vacant_rent" || property.occupancyStatus === "vacant_sale") return "vacant";
  if (property.latestSubmission && ["submitted", "in_review", "needs_revision"].includes(property.latestSubmission.status)) return "attention";
  if (property.contributions.some((contribution) => contribution.status === "pending")) return "attention";
  if (property.profile) return "verified";
  return "missing";
}

export function unplacedProperties(properties: PropertyMapSummary[]) {
  return properties.filter((property) => !OPAL_MAP_SLOT_BY_UNIT.has(property.unitCode));
}
