import { describe, expect, it } from "vitest";
import {
  isAnnouncementAssetPath,
  isFloorPlanAssetPath,
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
});
