export const OPAL_ATLAS_CENTER = { lat: -7.3536828, lng: 112.781988 } as const;
export const OPAL_ATLAS_DEFAULT_ZOOM = 19;

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
