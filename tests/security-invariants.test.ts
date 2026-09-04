import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAnnouncementAssetPath, isFloorPlanAssetPath, isPropertyAssetPath, isResidentEvidencePath, isStaffAssetPath } from "../src/lib/storage-paths";

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const securitySource = readFileSync(new URL("../src/lib/security.ts", import.meta.url), "utf8");
const nextConfigSource = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
const propertyImageRouteSource = readFileSync(new URL("../src/app/api/admin/property-image/[id]/route.ts", import.meta.url), "utf8");
const adminActionsSource = readFileSync(new URL("../src/app/admin/actions.ts", import.meta.url), "utf8");

describe("security invariants", () => {
  it("uses high-entropy, format-constrained private house tokens", () => {
    expect(securitySource).toContain("randomBytes(32)");
    expect(securitySource).toContain("/^[A-Za-z0-9_-]{40,80}$/");
    expect(securitySource).toContain("createHash(\"sha256\")");
  });

  it("keeps storage path access constrained to known buckets and extensions", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    expect(isAnnouncementAssetPath(`announcements/${id}.jpg`)).toBe(true);
    expect(isStaffAssetPath(`staff/${id}.webp`)).toBe(true);
    expect(isFloorPlanAssetPath(`floor-plans/${id}.png`)).toBe(true);
    expect(isPropertyAssetPath(`properties/${id}/${id}.jpg`, id)).toBe(true);
    expect(isResidentEvidencePath(`submissions/${id}/familyCard.heic`, id)).toBe(true);
    expect(isResidentEvidencePath(`submissions/${id}/../../staff/${id}.jpg`, id)).toBe(false);
    expect(isAnnouncementAssetPath(`staff/${id}.jpg`)).toBe(false);
  });

  it("keeps property images private and property-scoped without requiring a properties migration", () => {
    expect(schema).not.toContain("properties_image_path_check");
    expect(propertyImageRouteSource).toContain("await requireAdmin()");
    expect(propertyImageRouteSource).toContain("propertyImageSourceName(id)");
    expect(propertyImageRouteSource).toContain('storage.from("opal-assets").download');
    expect(propertyImageRouteSource).toContain('"cache-control": "private, no-store"');
    expect(propertyImageRouteSource).toContain('"cross-origin-resource-policy": "same-origin"');
    expect(adminActionsSource).toContain("persistPropertyImage({");
    expect(adminActionsSource).toContain('storage.from("opal-assets").upload');
    expect(adminActionsSource).toContain('from("source_imports")');
  });

  it("keeps private operational tables behind admin RLS", () => {
    for (const table of ["properties", "resident_profiles", "resident_submissions", "resident_evidence", "service_requests", "document_issuances", "cash_transaction_revisions", "admin_activity"]) {
      expect(schema).toContain(`alter table public.${table} enable row level security`);
    }
    expect(schema).toContain("create policy \"Admins manage resident evidence\" on public.resident_evidence");
    expect(schema).toContain("create policy \"Public reads published cash transactions\" on public.cash_transactions");
    expect(schema).toContain("('resident-evidence', 'resident-evidence', false");
    expect(schema).toContain("('document-exports', 'document-exports', false");
  });

  it("does not put private house tokens in the admin redirect flow", () => {
    const actions = readFileSync(new URL("../src/app/admin/actions.ts", import.meta.url), "utf8");
    const page = readFileSync(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");
    expect(actions).not.toContain("homeLink=");
    expect(page).not.toContain("homeLink");
  });

  it("ships browser isolation and production content restrictions", () => {
    expect(nextConfigSource).toContain('X-Frame-Options');
    expect(nextConfigSource).toContain('Content-Security-Policy');
    expect(nextConfigSource).toContain("frame-ancestors 'none'");
    expect(nextConfigSource).toContain("object-src 'none'");
    expect(nextConfigSource).toContain("form-action 'self'");
  });
});
