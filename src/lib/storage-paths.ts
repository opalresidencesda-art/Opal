const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const announcementAssetPattern = /^announcements\/[0-9a-f-]{36}\.(jpg|png|webp)$/i;
const staffAssetPattern = /^staff\/[0-9a-f-]{36}\.(jpg|png|webp)$/i;
const floorPlanAssetPattern = /^floor-plans\/[0-9a-f-]{36}\.(jpg|png|webp)$/i;
const residentEvidencePattern = /^submissions\/([0-9a-f-]{36})\/(responsibleKtp|familyCard|occupantKtp-\d{1,2})\.(jpg|png|webp|heic|heif)$/i;

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export function isAnnouncementAssetPath(value: string | null | undefined): value is string {
  return typeof value === "string" && announcementAssetPattern.test(value);
}

export function isStaffAssetPath(value: string | null | undefined): value is string {
  return typeof value === "string" && staffAssetPattern.test(value);
}

export function isFloorPlanAssetPath(value: string | null | undefined): value is string {
  return typeof value === "string" && floorPlanAssetPattern.test(value);
}

export function isResidentEvidencePath(value: string | null | undefined, submissionId?: string): value is string {
  if (typeof value !== "string") return false;
  const match = value.match(residentEvidencePattern);
  if (!match) return false;
  return submissionId ? match[1].toLowerCase() === submissionId.toLowerCase() : true;
}
