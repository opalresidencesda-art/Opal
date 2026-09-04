import { describe, expect, it, vi } from "vitest";
import {
  PROPERTY_IMAGE_MAX_BYTES,
  assertApplyConfiguration,
  inspectImage,
  parseArguments,
  parseEnvironment,
  planInventory,
  runImport,
} from "../scripts/property-image-import/import-property-images.mjs";

function candidate(fileId: string, unitCode: string) {
  return {
    file_id: fileId,
    mime_type: "image/jpeg",
    download_url: `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
    comments: [{ exact_text: "Location reference", location_candidate: { unit_code: unitCode } }],
    parsed_unit_code: unitCode,
    classification: "single_location_candidate",
  };
}

describe("property image import planning", () => {
  it("skips every file for a duplicated unit code", () => {
    const plan = planInventory([
      candidate("source-file-0001", "OP 5 - 42"),
      candidate("source-file-0002", "OP 5 - 42"),
      candidate("source-file-0003", "OP 1 - 01"),
    ]);

    expect(plan.map(({ sourceFileId, unitCode, status }) => ({ sourceFileId, unitCode, status }))).toEqual([
      { sourceFileId: "source-file-0001", unitCode: "OP 5 - 42", status: "skipped_duplicate_unit_code" },
      { sourceFileId: "source-file-0002", unitCode: "OP 5 - 42", status: "skipped_duplicate_unit_code" },
      { sourceFileId: "source-file-0003", unitCode: "OP 1 - 01", status: "candidate" },
    ]);
  });
});

describe("apply configuration", () => {
  it("requires an explicit environment file", () => {
    expect(() => assertApplyConfiguration({
      apply: false,
      envFilePath: null,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-value",
      },
    })).toThrow("Provide an explicit environment file with --env-file");
  });

  it("rejects a local Supabase URL in apply mode", () => {
    expect(() => assertApplyConfiguration({
      apply: true,
      envFilePath: "/secure/production.env",
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-value",
      },
    })).toThrow("Apply mode requires a non-local Supabase URL");
  });

  it("parses an explicit environment file", () => {
    expect(parseEnvironment(`
      # Production credentials
      NEXT_PUBLIC_SUPABASE_URL="https://project.supabase.co"
      export SUPABASE_SERVICE_ROLE_KEY='secret-value'
    `)).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "secret-value",
    });
  });

  it("keeps dry-run as the default CLI mode", () => {
    expect(parseArguments([
      "--inventory", "fixtures/inventory.json",
      "--env-file", "fixtures/production.env",
    ])).toMatchObject({ apply: false, rateLimitMs: 500 });
  });
});

describe("image validation", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

  it("accepts matching JPEG magic and MIME values", () => {
    expect(inspectImage(jpeg, "image/jpeg", "image/jpeg")).toMatchObject({ extension: "jpg", mimeType: "image/jpeg" });
  });

  it.each([
    ["empty bytes", Buffer.alloc(0), "image/jpeg", "image/jpeg"],
    ["oversized bytes", Buffer.alloc(PROPERTY_IMAGE_MAX_BYTES + 1, 1), "image/jpeg", "image/jpeg"],
    ["invalid magic", Buffer.from("not an image"), "image/jpeg", "image/jpeg"],
    ["response MIME mismatch", jpeg, "image/jpeg", "image/png"],
    ["inventory MIME mismatch", jpeg, "image/png", "image/jpeg"],
  ])("rejects %s", (_, bytes, inventoryMime, responseMime) => {
    expect(() => inspectImage(bytes, inventoryMime, responseMime)).toThrow();
  });
});

function importerDependencies(overrides: Record<string, unknown> = {}) {
  const events: string[] = [];
  const propertyId = "123e4567-e89b-12d3-a456-426614174000";
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
  const db = {
    findPropertiesByUnitCode: vi.fn(async (unitCode: string) => {
      events.push(`find:${unitCode}`);
      return [{ id: propertyId, unit_code: unitCode, image_path: null }];
    }),
    setImagePathIfNull: vi.fn(async (id: string, storagePath: string) => {
      events.push(`update:${id}:${storagePath}`);
      return { id, image_path: storagePath };
    }),
    readProperty: vi.fn(async (id: string) => {
      events.push(`read:${id}`);
      return { id, unit_code: "OP 1 - 01", image_path: `properties/${id}/323e4567-e89b-12d3-a456-426614174000.jpg` };
    }),
    clearImagePathIfMatches: vi.fn(async (id: string, storagePath: string) => {
      events.push(`clear:${id}:${storagePath}`);
      return true;
    }),
  };
  const storage = {
    upload: vi.fn(async (path: string) => { events.push(`upload:${path}`); }),
    remove: vi.fn(async (path: string) => { events.push(`remove:${path}`); }),
    download: vi.fn(async (path: string) => {
      events.push(`storage-download:${path}`);
      return bytes;
    }),
  };
  const dependencies = {
    db,
    storage,
    downloadSource: vi.fn(async () => {
      events.push("source-download");
      return { bytes, mimeType: "image/jpeg" };
    }),
    appendAudit: vi.fn(async () => {}),
    randomUUID: () => "323e4567-e89b-12d3-a456-426614174000",
    sleep: vi.fn(async () => {}),
    now: () => "2026-08-25T00:00:00.000Z",
    ...overrides,
  };
  return { events, propertyId, bytes, db, storage, dependencies };
}

describe("property image import execution", () => {
  it("performs read-only validation in default dry-run mode", async () => {
    const setup = importerDependencies();

    const results = await runImport({
      items: [candidate("source-file-0001", "OP 1 - 01")],
      apply: false,
      rateLimitMs: 0,
      ...setup.dependencies,
    });

    expect(results[0]).toMatchObject({ status: "dry_run_validated", targetUnitCode: "OP 1 - 01", targetPropertyId: setup.propertyId });
    expect(setup.db.setImagePathIfNull).not.toHaveBeenCalled();
    expect(setup.storage.upload).not.toHaveBeenCalled();
    expect(setup.storage.remove).not.toHaveBeenCalled();
    expect(setup.dependencies.appendAudit).not.toHaveBeenCalled();
    expect(setup.events).toEqual(["find:OP 1 - 01", "source-download"]);
  });

  it("does not query duplicated, no-comment, or conflicting inventory entries", async () => {
    const setup = importerDependencies();
    const noComment = { ...candidate("source-file-0003", "OP 2 - 02"), classification: "no_comment", comments: [] };
    const conflicting = { ...candidate("source-file-0004", "OP 3 - 03"), classification: "conflicting_locations" };

    const results = await runImport({
      items: [
        candidate("source-file-0001", "OP 5 - 42"),
        candidate("source-file-0002", "OP 5 - 42"),
        noComment,
        conflicting,
      ],
      apply: false,
      rateLimitMs: 0,
      ...setup.dependencies,
    });

    expect(results.map((result) => result.status)).toEqual([
      "skipped_duplicate_unit_code",
      "skipped_duplicate_unit_code",
      "skipped_ineligible_classification",
      "skipped_ineligible_classification",
    ]);
    expect(setup.db.findPropertiesByUnitCode).not.toHaveBeenCalled();
    expect(setup.dependencies.downloadSource).not.toHaveBeenCalled();
  });

  it.each([
    [[], "skipped_property_not_found"],
    [[
      { id: "123e4567-e89b-12d3-a456-426614174000", unit_code: "OP 1 - 01", image_path: null },
      { id: "223e4567-e89b-12d3-a456-426614174000", unit_code: "OP 1 - 01", image_path: null },
    ], "skipped_property_match_not_unique"],
  ])("requires exactly one exact property match", async (properties, expectedStatus) => {
    const setup = importerDependencies();
    setup.db.findPropertiesByUnitCode.mockResolvedValue(properties);

    const [result] = await runImport({
      items: [candidate("source-file-0001", "OP 1 - 01")],
      apply: false,
      rateLimitMs: 0,
      ...setup.dependencies,
    });

    expect(result.status).toBe(expectedStatus);
    expect(setup.dependencies.downloadSource).not.toHaveBeenCalled();
  });

  it("skips a property that already has an image", async () => {
    const setup = importerDependencies();
    setup.db.findPropertiesByUnitCode.mockResolvedValue([{
      id: setup.propertyId,
      unit_code: "OP 1 - 01",
      image_path: `properties/${setup.propertyId}/423e4567-e89b-12d3-a456-426614174000.jpg`,
    }]);

    const [result] = await runImport({
      items: [candidate("source-file-0001", "OP 1 - 01")],
      apply: true,
      rateLimitMs: 0,
      ...setup.dependencies,
    });

    expect(result.status).toBe("skipped_existing_image");
    expect(setup.dependencies.downloadSource).not.toHaveBeenCalled();
    expect(setup.storage.upload).not.toHaveBeenCalled();
  });

  it("uploads, conditionally updates, reads back, and verifies source bytes sequentially", async () => {
    const setup = importerDependencies();

    const [result] = await runImport({
      items: [candidate("source-file-0001", "OP 1 - 01")],
      apply: true,
      rateLimitMs: 0,
      ...setup.dependencies,
    });

    const expectedPath = `properties/${setup.propertyId}/323e4567-e89b-12d3-a456-426614174000.jpg`;
    expect(result).toMatchObject({
      sourceFileId: "source-file-0001",
      targetUnitCode: "OP 1 - 01",
      targetPropertyId: setup.propertyId,
      storagePath: expectedPath,
      status: "imported_verified",
      error: null,
    });
    expect(result.sourceSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.storedSha256).toBe(result.sourceSha256);
    expect(setup.events).toEqual([
      "find:OP 1 - 01",
      "source-download",
      `upload:${expectedPath}`,
      `update:${setup.propertyId}:${expectedPath}`,
      `read:${setup.propertyId}`,
      `storage-download:${expectedPath}`,
    ]);
    expect(setup.dependencies.appendAudit).toHaveBeenCalledWith(result);
  });

  it("removes the uploaded object when the conditional update loses a race", async () => {
    const setup = importerDependencies();
    setup.db.setImagePathIfNull.mockImplementation(async (id: string, storagePath: string) => {
      setup.events.push(`update:${id}:${storagePath}`);
      return null;
    });

    const [result] = await runImport({
      items: [candidate("source-file-0001", "OP 1 - 01")],
      apply: true,
      rateLimitMs: 0,
      ...setup.dependencies,
    });

    expect(result).toMatchObject({ status: "failed", error: "Conditional image_path update lost a race or matched no property" });
    expect(setup.storage.remove).toHaveBeenCalledWith(result.storagePath);
    expect(setup.db.readProperty).not.toHaveBeenCalled();
  });

  it("rolls back both database path and object after post-commit verification fails", async () => {
    const setup = importerDependencies();
    setup.storage.download.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00]));

    const [result] = await runImport({
      items: [candidate("source-file-0001", "OP 1 - 01")],
      apply: true,
      rateLimitMs: 0,
      ...setup.dependencies,
    });

    expect(result).toMatchObject({
      status: "failed",
      rollbackStatus: "database_and_storage_reverted",
      error: "Stored object SHA-256 did not match source SHA-256",
    });
    expect(setup.db.clearImagePathIfMatches).toHaveBeenCalledWith(setup.propertyId, result.storagePath);
    expect(setup.storage.remove).toHaveBeenCalledWith(result.storagePath);
  });
});
