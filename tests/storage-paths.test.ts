import { describe, expect, it } from "vitest";
import {
  buildPropertyAssetPath,
  isAnnouncementAssetPath,
  isFloorPlanAssetPath,
  isPropertyAssetPath,
  isResidentEvidencePath,
  isStaffAssetPath,
  isUuid,
} from "../src/lib/storage-paths";

describe("storage path guards", () => {
  it("accepts only the expected UUID and asset path shapes", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isAnnouncementAssetPath("announcements/123e4567-e89b-12d3-a456-426614174000.webp")).toBe(true);
    expect(isStaffAssetPath("staff/123e4567-e89b-12d3-a456-426614174000.jpg")).toBe(true);
    expect(isFloorPlanAssetPath("floor-plans/123e4567-e89b-12d3-a456-426614174000.png")).toBe(true);
    expect(isResidentEvidencePath("submissions/123e4567-e89b-12d3-a456-426614174000/familyCard.heic", "123e4567-e89b-12d3-a456-426614174000")).toBe(true);
  });

  it("rejects cross-scope or malformed paths", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isAnnouncementAssetPath("staff/123e4567-e89b-12d3-a456-426614174000.webp")).toBe(false);
    expect(isStaffAssetPath("staff/not-a-uuid.jpg")).toBe(false);
    expect(isFloorPlanAssetPath("floor-plans/123e4567-e89b-12d3-a456-426614174000.gif")).toBe(false);
    expect(isResidentEvidencePath("submissions/123e4567-e89b-12d3-a456-426614174000/../../staff.jpg", "123e4567-e89b-12d3-a456-426614174000")).toBe(false);
    expect(isResidentEvidencePath("submissions/123e4567-e89b-12d3-a456-426614174000/familyCard.heic", "223e4567-e89b-12d3-a456-426614174000")).toBe(false);
  });

  it("builds a property-scoped image path from trusted UUIDs and MIME type", () => {
    const propertyId = "123e4567-e89b-12d3-a456-426614174000";
    const assetId = "223e4567-e89b-12d3-a456-426614174000";

    expect(buildPropertyAssetPath(propertyId, assetId, "image/webp")).toBe(`properties/${propertyId}/${assetId}.webp`);
    expect(isPropertyAssetPath(`properties/${propertyId}/${assetId}.webp`, propertyId)).toBe(true);
  });

  it("rejects property paths with malformed or mismatched IDs and unsupported extensions", () => {
    const propertyId = "123e4567-e89b-12d3-a456-426614174000";
    const assetId = "223e4567-e89b-12d3-a456-426614174000";

    expect(isPropertyAssetPath(`properties/${propertyId}/${assetId}.jpg`)).toBe(true);
    expect(isPropertyAssetPath(`properties/not-a-uuid/${assetId}.jpg`)).toBe(false);
    expect(isPropertyAssetPath(`properties/${propertyId}/../../staff/${assetId}.jpg`, propertyId)).toBe(false);
    expect(isPropertyAssetPath(`properties/${propertyId}/${assetId}.gif`, propertyId)).toBe(false);
    expect(isPropertyAssetPath(`properties/${propertyId}/${assetId}.jpg`, "323e4567-e89b-12d3-a456-426614174000")).toBe(false);
    expect(() => buildPropertyAssetPath(propertyId, assetId, "image/gif")).toThrow("Unsupported property image type");
  });
});
