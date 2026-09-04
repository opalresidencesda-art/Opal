import { isPropertyAssetPath, isUuid } from "@/lib/storage-paths";

export const PROPERTY_IMAGE_SOURCE_PREFIX = "property-image:";

export type PropertyImageRecord = {
  id: string;
  source_name: string;
  notes: string | null;
  imported_at: string;
};

export function propertyImageSourceName(propertyId: string) {
  if (!isUuid(propertyId)) throw new Error("Invalid property image identifier");
  return `${PROPERTY_IMAGE_SOURCE_PREFIX}${propertyId.toLowerCase()}`;
}

export function parsePropertyImageRecord(record: PropertyImageRecord): { propertyId: string; storagePath: string } | null {
  const propertyId = record.source_name.startsWith(PROPERTY_IMAGE_SOURCE_PREFIX)
    ? record.source_name.slice(PROPERTY_IMAGE_SOURCE_PREFIX.length)
    : "";
  if (!isUuid(propertyId) || !record.notes) return null;
  try {
    const value = JSON.parse(record.notes) as { storagePath?: unknown };
    const storagePath = typeof value.storagePath === "string" ? value.storagePath : null;
    if (!isPropertyAssetPath(storagePath, propertyId)) return null;
    return { propertyId, storagePath };
  } catch {
    return null;
  }
}

export function latestPropertyImagePaths(records: PropertyImageRecord[]) {
  const paths = new Map<string, string>();
  for (const record of records) {
    const parsed = parsePropertyImageRecord(record);
    if (parsed && !paths.has(parsed.propertyId)) paths.set(parsed.propertyId, parsed.storagePath);
  }
  return paths;
}
