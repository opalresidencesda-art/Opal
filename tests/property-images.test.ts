import { describe, expect, it, vi } from "vitest";
import { PROPERTY_IMAGE_MAX_BYTES, persistPropertyImage } from "../src/lib/property-images";

const propertyId = "123e4567-e89b-12d3-a456-426614174000";
const oldAssetId = "223e4567-e89b-12d3-a456-426614174000";
const newAssetId = "323e4567-e89b-12d3-a456-426614174000";
const oldPath = `properties/${propertyId}/${oldAssetId}.jpg`;
const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webpBytes = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

function dependencies(events: string[]) {
  return {
    upload: vi.fn(async (path: string) => { events.push(`upload:${path}`); }),
    saveImagePath: vi.fn(async (path: string | null) => { events.push(`save:${path}`); }),
    remove: vi.fn(async (path: string) => { events.push(`remove:${path}`); }),
  };
}

function input(events: string[], overrides: Partial<Parameters<typeof persistPropertyImage>[0]> = {}) {
  return {
    propertyId,
    existingImagePath: oldPath,
    image: null,
    removeImage: false,
    assetId: newAssetId,
    ...dependencies(events),
    ...overrides,
  };
}

describe("property image persistence", () => {
  it("preserves the existing image without writing when upload and removal are not requested", async () => {
    const events: string[] = [];
    const values = input(events);

    const result = await persistPropertyImage(values);

    expect(result).toBe(oldPath);
    expect(values.saveImagePath).not.toHaveBeenCalled();
    expect(values.remove).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("removes the existing image even when no replacement is uploaded", async () => {
    const events: string[] = [];
    const values = input(events, { removeImage: true });

    const result = await persistPropertyImage(values);

    expect(result).toBeNull();
    expect(events).toEqual(["save:null", `remove:${oldPath}`]);
  });

  it("does nothing when removal is requested without an existing image", async () => {
    const events: string[] = [];
    const values = input(events, { existingImagePath: null, removeImage: true });

    const result = await persistPropertyImage(values);

    expect(result).toBeNull();
    expect(values.saveImagePath).not.toHaveBeenCalled();
    expect(values.remove).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it.each([
    ["unsupported MIME type", new File([new Uint8Array([1])], "rumah.gif", { type: "image/gif" })],
    ["oversized file", new File([new Uint8Array(PROPERTY_IMAGE_MAX_BYTES + 1)], "rumah.jpg", { type: "image/jpeg" })],
    ["empty file", new File([], "rumah.jpg", { type: "image/jpeg" })],
  ])("rejects an %s before upload", async (_, image) => {
    const events: string[] = [];
    const values = input(events, { image });

    await expect(persistPropertyImage(values)).rejects.toThrow("Gambar rumah harus berupa JPG, PNG, atau WEBP maksimal 5 MB.");
    expect(values.upload).not.toHaveBeenCalled();
    expect(values.saveImagePath).not.toHaveBeenCalled();
    expect(values.remove).not.toHaveBeenCalled();
  });

  it.each([
    ["image/jpeg", "rumah.jpg"],
    ["image/png", "rumah.png"],
    ["image/webp", "rumah.webp"],
  ])("rejects declared %s content with a mismatched signature before upload", async (type, name) => {
    const events: string[] = [];
    const image = new File([new Uint8Array([1, 2, 3])], name, { type });
    const values = input(events, { image });

    await expect(persistPropertyImage(values)).rejects.toThrow("Gambar rumah harus berupa JPG, PNG, atau WEBP maksimal 5 MB.");
    expect(values.upload).not.toHaveBeenCalled();
    expect(values.saveImagePath).not.toHaveBeenCalled();
    expect(values.remove).not.toHaveBeenCalled();
  });

  it("uploads a replacement before saving its path and removes the old image afterward", async () => {
    const events: string[] = [];
    const image = new File([webpBytes], "rumah.webp", { type: "image/webp" });
    const values = input(events, { image });
    const newPath = `properties/${propertyId}/${newAssetId}.webp`;

    const result = await persistPropertyImage(values);

    expect(result).toBe(newPath);
    expect(values.upload).toHaveBeenCalledWith(newPath, webpBytes, "image/webp");
    expect(events).toEqual([`upload:${newPath}`, `save:${newPath}`, `remove:${oldPath}`]);
  });

  it("removes the newly uploaded file when saving its path fails", async () => {
    const events: string[] = [];
    const image = new File([pngBytes], "rumah.png", { type: "image/png" });
    const newPath = `properties/${propertyId}/${newAssetId}.png`;
    const values = input(events, {
      image,
      saveImagePath: vi.fn(async (path: string | null) => {
        events.push(`save:${path}`);
        throw new Error("database unavailable");
      }),
    });

    await expect(persistPropertyImage(values)).rejects.toThrow("database unavailable");
    expect(events).toEqual([`upload:${newPath}`, `save:${newPath}`, `remove:${newPath}`]);
    expect(values.remove).not.toHaveBeenCalledWith(oldPath);
  });

  it("does not remove the old image when clearing its path fails", async () => {
    const events: string[] = [];
    const values = input(events, {
      removeImage: true,
      saveImagePath: vi.fn(async (path: string | null) => {
        events.push(`save:${path}`);
        throw new Error("database unavailable");
      }),
    });

    await expect(persistPropertyImage(values)).rejects.toThrow("database unavailable");
    expect(events).toEqual(["save:null"]);
    expect(values.remove).not.toHaveBeenCalled();
  });
});
