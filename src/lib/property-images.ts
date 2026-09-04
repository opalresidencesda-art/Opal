import { buildPropertyAssetPath, isPropertyAssetPath } from "@/lib/storage-paths";

export const PROPERTY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROPERTY_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const propertyImageValidationMessage = "Gambar rumah harus berupa JPG, PNG, atau WEBP maksimal 5 MB.";
const jpegSignature = [0xff, 0xd8, 0xff];
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const riffSignature = [0x52, 0x49, 0x46, 0x46];
const webpSignature = [0x57, 0x45, 0x42, 0x50];

type PropertyImageFile = {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

type PersistPropertyImageInput = {
  propertyId: string;
  existingImagePath: string | null;
  image: PropertyImageFile | null;
  removeImage: boolean;
  assetId: string;
  upload(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  saveImagePath(path: string | null): Promise<void>;
  remove(path: string): Promise<void>;
};

function hasSignature(bytes: Uint8Array, signature: readonly number[], offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function hasValidPropertyImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return hasSignature(bytes, jpegSignature);
  if (type === "image/png") return hasSignature(bytes, pngSignature);
  if (type === "image/webp") {
    return hasSignature(bytes, riffSignature) && hasSignature(bytes, webpSignature, 8);
  }
  return false;
}

export async function persistPropertyImage(input: PersistPropertyImageInput) {
  if (input.existingImagePath && !isPropertyAssetPath(input.existingImagePath, input.propertyId)) {
    throw new Error("Path gambar rumah tidak valid.");
  }

  if (!input.image) {
    const existingImagePath = input.existingImagePath;
    if (!input.removeImage || !existingImagePath) return existingImagePath;
    await input.saveImagePath(null);
    await input.remove(existingImagePath);
    return null;
  }

  if (
    input.image.size < 1
    || input.image.size > PROPERTY_IMAGE_MAX_BYTES
    || !PROPERTY_IMAGE_MIME_TYPES.includes(input.image.type as (typeof PROPERTY_IMAGE_MIME_TYPES)[number])
  ) {
    throw new Error(propertyImageValidationMessage);
  }

  const bytes = new Uint8Array(await input.image.arrayBuffer());
  if (!hasValidPropertyImageSignature(input.image.type, bytes)) {
    throw new Error(propertyImageValidationMessage);
  }

  const nextPath = buildPropertyAssetPath(input.propertyId, input.assetId, input.image.type);
  await input.upload(nextPath, bytes, input.image.type);
  try {
    await input.saveImagePath(nextPath);
  } catch (error) {
    try {
      await input.remove(nextPath);
    } catch {
      // Preserve the database error; cleanup was attempted.
    }
    throw error;
  }
  if (input.existingImagePath && input.existingImagePath !== nextPath) await input.remove(input.existingImagePath);
  return nextPath;
}
