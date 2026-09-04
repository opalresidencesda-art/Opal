#!/usr/bin/env node

import { createHash, randomUUID as createRandomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const PROPERTY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGES = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes) => bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP",
  },
};
const ALLOWED_DOWNLOAD_HOSTS = new Set(["drive.usercontent.google.com", "drive.google.com"]);
const UNIT_CODE_PATTERN = /^OP [1235] - [0-9]{2,3}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizedMimeType(value) {
  return String(value ?? "").split(";", 1)[0].trim().toLowerCase();
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function inspectImage(bytesValue, inventoryMimeValue, responseMimeValue) {
  const bytes = Buffer.from(bytesValue);
  if (bytes.length === 0) throw new Error("Source image is empty");
  if (bytes.length > PROPERTY_IMAGE_MAX_BYTES) throw new Error("Source image exceeds the 5 MiB limit");

  const detected = Object.entries(SUPPORTED_IMAGES).find(([, format]) => format.matches(bytes));
  if (!detected) throw new Error("Source bytes are not a supported JPEG, PNG, or WEBP image");

  const [mimeType, format] = detected;
  const inventoryMime = normalizedMimeType(inventoryMimeValue);
  const responseMime = normalizedMimeType(responseMimeValue);
  if (inventoryMime !== mimeType) throw new Error(`Inventory MIME does not match image bytes: ${inventoryMime || "missing"}`);
  if (responseMime !== mimeType) throw new Error(`Download MIME does not match image bytes: ${responseMime || "missing"}`);
  return { bytes, byteLength: bytes.length, extension: format.extension, mimeType, sha256: sha256(bytes) };
}

function isLocalHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "localhost"
    || normalized.endsWith(".localhost")
    || normalized === "::1"
    || normalized === "0.0.0.0"
    || normalized.startsWith("127.");
}

export function assertApplyConfiguration({ apply, envFilePath, env }) {
  if (!envFilePath) throw new Error("Provide an explicit environment file with --env-file");
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("The environment file must define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  let url;
  try {
    url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL");
  }
  if (apply && (url.protocol !== "https:" || isLocalHostname(url.hostname))) {
    throw new Error("Apply mode requires a non-local Supabase URL using HTTPS");
  }
  return { url: url.toString(), serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY };
}

export function parseEnvironment(content) {
  const env = {};
  for (const sourceLine of String(content).split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) continue;
    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separator = normalized.indexOf("=");
    if (separator < 1) continue;
    const key = normalized.slice(0, separator).trim();
    let value = normalized.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

export function parseArguments(argv) {
  const options = {
    apply: false,
    auditPath: null,
    envFilePath: null,
    inventoryPath: null,
    rateLimitMs: 500,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") {
      options.apply = true;
      continue;
    }
    const keyMap = {
      "--audit": "auditPath",
      "--env-file": "envFilePath",
      "--inventory": "inventoryPath",
      "--rate-limit-ms": "rateLimitMs",
    };
    const key = keyMap[argument];
    if (!key) throw new Error(`Unknown argument: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    options[key] = key === "rateLimitMs" ? Number(value) : resolve(value);
    index += 1;
  }
  if (!options.inventoryPath) throw new Error("Provide an inventory JSON file with --inventory");
  if (!options.envFilePath) throw new Error("Provide an explicit environment file with --env-file");
  if (!Number.isInteger(options.rateLimitMs) || options.rateLimitMs < 0 || options.rateLimitMs > 60_000) {
    throw new Error("--rate-limit-ms must be an integer between 0 and 60000");
  }
  options.auditPath ??= resolve(dirname(options.inventoryPath), "property-image-import-audit.json");
  return options;
}

function hasMatchingLocationComment(item, unitCode) {
  if (!Array.isArray(item.comments)) return false;
  const matches = item.comments.filter((comment) => {
    return typeof comment?.exact_text === "string"
      && comment.exact_text.trim().length > 0
      && comment?.location_candidate?.unit_code === unitCode;
  });
  return matches.length === 1;
}

export function planInventory(items) {
  if (!Array.isArray(items)) throw new Error("Inventory items must be an array");
  const unitCounts = new Map();

  for (const item of items) {
    if (item?.classification === "single_location_candidate" && typeof item.parsed_unit_code === "string") {
      unitCounts.set(item.parsed_unit_code, (unitCounts.get(item.parsed_unit_code) ?? 0) + 1);
    }
  }

  return items.map((item) => {
    const sourceFileId = typeof item?.file_id === "string" ? item.file_id : null;
    const unitCode = typeof item?.parsed_unit_code === "string" ? item.parsed_unit_code : null;

    if (item?.classification !== "single_location_candidate") {
      return { sourceFileId, unitCode, status: "skipped_ineligible_classification" };
    }
    if (!sourceFileId) return { sourceFileId, unitCode, status: "skipped_missing_source_file_id" };
    if (!unitCode || !UNIT_CODE_PATTERN.test(unitCode)) {
      return { sourceFileId, unitCode, status: "skipped_invalid_unit_code" };
    }
    if (!hasMatchingLocationComment(item, unitCode)) {
      return { sourceFileId, unitCode, status: "skipped_comment_location_mismatch" };
    }
    if ((unitCounts.get(unitCode) ?? 0) > 1) {
      return { sourceFileId, unitCode, status: "skipped_duplicate_unit_code" };
    }
    return { sourceFileId, unitCode, status: "candidate", item };
  });
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function resultFor(entry, now, values = {}) {
  return {
    timestamp: now(),
    sourceFileId: entry.sourceFileId,
    targetUnitCode: entry.unitCode,
    targetPropertyId: null,
    sourceSha256: null,
    storedSha256: null,
    storagePath: null,
    status: entry.status,
    rollbackStatus: null,
    error: null,
    ...values,
  };
}

async function rollbackCommittedImage({ db, storage, propertyId, storagePath }) {
  const cleared = await db.clearImagePathIfMatches(propertyId, storagePath);
  if (!cleared) return "database_path_changed_not_removed";
  await storage.remove(storagePath);
  return "database_and_storage_reverted";
}

export async function runImport({
  items,
  apply = false,
  rateLimitMs = 500,
  db,
  storage,
  downloadSource,
  appendAudit,
  randomUUID,
  sleep,
  now,
}) {
  const results = [];

  for (const entry of planInventory(items)) {
    let result;
    if (entry.status !== "candidate") {
      result = resultFor(entry, now);
    } else {
      try {
        const properties = await db.findPropertiesByUnitCode(entry.unitCode);
        if (properties.length !== 1) {
          result = resultFor(entry, now, {
            status: properties.length === 0 ? "skipped_property_not_found" : "skipped_property_match_not_unique",
            error: `Expected exactly one existing property; found ${properties.length}`,
          });
        } else {
          const property = properties[0];
          const target = { targetPropertyId: property.id };
          if (!UUID_PATTERN.test(property.id)) {
            result = resultFor(entry, now, { ...target, status: "skipped_invalid_property_id", error: "Matched property ID is not a UUID" });
          } else if (property.unit_code !== entry.unitCode) {
            result = resultFor(entry, now, { ...target, status: "skipped_property_unit_mismatch", error: "Returned property unit code did not match the exact query" });
          } else if (property.image_path !== null) {
            result = resultFor(entry, now, { ...target, status: "skipped_existing_image" });
          } else {
            const source = await downloadSource(entry.item);
            const image = inspectImage(source.bytes, entry.item.mime_type, source.mimeType);
            const assetId = randomUUID();
            if (!UUID_PATTERN.test(assetId)) throw new Error("Generated asset ID is not a UUID");
            const storagePath = `properties/${property.id}/${assetId}.${image.extension}`;
            const audited = { ...target, sourceSha256: image.sha256, storagePath };

            if (!apply) {
              result = resultFor(entry, now, { ...audited, status: "dry_run_validated" });
            } else {
              let uploaded = false;
              let databaseUpdated = false;
              try {
                await storage.upload(storagePath, image.bytes, image.mimeType);
                uploaded = true;
                const updated = await db.setImagePathIfNull(property.id, storagePath);
                if (!updated || updated.id !== property.id || updated.image_path !== storagePath) {
                  throw new Error("Conditional image_path update lost a race or matched no property");
                }
                databaseUpdated = true;

                const readBack = await db.readProperty(property.id);
                if (!readBack || readBack.unit_code !== entry.unitCode || readBack.image_path !== storagePath) {
                  throw new Error("Database read-back did not match the imported property image");
                }
                const storedBytes = Buffer.from(await storage.download(storagePath));
                const storedSha256 = sha256(storedBytes);
                if (storedSha256 !== image.sha256) throw new Error("Stored object SHA-256 did not match source SHA-256");
                result = resultFor(entry, now, { ...audited, storedSha256, status: "imported_verified" });
              } catch (error) {
                let rollbackStatus = null;
                let cleanupError = null;
                if (uploaded) {
                  try {
                    if (databaseUpdated) {
                      rollbackStatus = await rollbackCommittedImage({ db, storage, propertyId: property.id, storagePath });
                    } else {
                      await storage.remove(storagePath);
                      rollbackStatus = "storage_object_removed";
                    }
                  } catch (cleanupFailure) {
                    rollbackStatus = "rollback_failed";
                    cleanupError = `; cleanup failed: ${errorMessage(cleanupFailure)}`;
                  }
                }
                result = resultFor(entry, now, {
                  ...audited,
                  status: "failed",
                  rollbackStatus,
                  error: `${errorMessage(error)}${cleanupError ?? ""}`,
                });
              }
            }
          }
        }
      } catch (error) {
        result = resultFor(entry, now, { status: "failed", error: errorMessage(error) });
      }
    }

    if (apply) await appendAudit(result);
    results.push(result);
    if (rateLimitMs > 0) await sleep(rateLimitMs);
  }

  return results;
}

export function createSupabaseAdapters(client) {
  const bucket = client.storage.from("opal-assets");
  return {
    db: {
      async findPropertiesByUnitCode(unitCode) {
        const { data, error } = await client
          .from("properties")
          .select("id,unit_code,image_path")
          .eq("unit_code", unitCode)
          .limit(2);
        if (error) throw new Error(`Property lookup failed: ${error.message}`);
        return data ?? [];
      },
      async setImagePathIfNull(propertyId, storagePath) {
        const { data, error } = await client
          .from("properties")
          .update({ image_path: storagePath })
          .eq("id", propertyId)
          .is("image_path", null)
          .select("id,image_path")
          .maybeSingle();
        if (error) throw new Error(`Conditional property update failed: ${error.message}`);
        return data;
      },
      async clearImagePathIfMatches(propertyId, storagePath) {
        const { data, error } = await client
          .from("properties")
          .update({ image_path: null })
          .eq("id", propertyId)
          .eq("image_path", storagePath)
          .select("id")
          .maybeSingle();
        if (error) throw new Error(`Property rollback failed: ${error.message}`);
        return Boolean(data);
      },
      async readProperty(propertyId) {
        const { data, error } = await client
          .from("properties")
          .select("id,unit_code,image_path")
          .eq("id", propertyId)
          .maybeSingle();
        if (error) throw new Error(`Property read-back failed: ${error.message}`);
        return data;
      },
    },
    storage: {
      async upload(storagePath, bytes, mimeType) {
        const { error } = await bucket.upload(storagePath, bytes, { contentType: mimeType, upsert: false });
        if (error) throw new Error(`Storage upload failed: ${error.message}`);
      },
      async download(storagePath) {
        const { data, error } = await bucket.download(storagePath);
        if (error || !data) throw new Error(`Storage read-back failed: ${error?.message ?? "missing object"}`);
        return Buffer.from(await data.arrayBuffer());
      },
      async remove(storagePath) {
        const { error } = await bucket.remove([storagePath]);
        if (error) throw new Error(`Storage cleanup failed: ${error.message}`);
      },
    },
  };
}

export async function downloadGoogleDriveSource(item) {
  if (typeof item?.download_url !== "string") throw new Error("Inventory item is missing a download URL");
  const url = new URL(item.download_url);
  if (url.protocol !== "https:" || !ALLOWED_DOWNLOAD_HOSTS.has(url.hostname)) {
    throw new Error("Inventory download URL is not an allowed Google Drive HTTPS URL");
  }
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
    headers: { "user-agent": "OPAL property image importer/1.0" },
  });
  if (!response.ok) throw new Error(`Source download failed with HTTP ${response.status}`);
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== "https:" || !ALLOWED_DOWNLOAD_HOSTS.has(finalUrl.hostname)) {
    throw new Error("Source download redirected to an unapproved host");
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > PROPERTY_IMAGE_MAX_BYTES) {
    throw new Error("Source image exceeds the 5 MiB limit");
  }
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    mimeType: response.headers.get("content-type"),
  };
}

export function createJsonAuditAppender(auditPath) {
  return async (entry) => {
    let previous = [];
    try {
      const parsed = JSON.parse(await readFile(auditPath, "utf8"));
      if (!Array.isArray(parsed)) throw new Error("Audit file root must be an array");
      previous = parsed;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const next = [...previous, entry];
    const temporaryPath = `${auditPath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
    await rename(temporaryPath, auditPath);
  };
}

function summarize(results) {
  const statuses = {};
  for (const result of results) statuses[result.status] = (statuses[result.status] ?? 0) + 1;
  return { total: results.length, statuses };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const env = parseEnvironment(await readFile(options.envFilePath, "utf8"));
  const configuration = assertApplyConfiguration({
    apply: options.apply,
    envFilePath: options.envFilePath,
    env,
  });
  const inventory = JSON.parse(await readFile(options.inventoryPath, "utf8"));
  if (!Array.isArray(inventory.items)) throw new Error("Inventory JSON must contain an items array");

  const client = createClient(configuration.url, configuration.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adapters = createSupabaseAdapters(client);
  const results = await runImport({
    items: inventory.items,
    apply: options.apply,
    rateLimitMs: options.rateLimitMs,
    ...adapters,
    downloadSource: downloadGoogleDriveSource,
    appendAudit: createJsonAuditAppender(options.auditPath),
    randomUUID: createRandomUUID,
    sleep: (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
    now: () => new Date().toISOString(),
  });

  console.log(JSON.stringify({
    mode: options.apply ? "apply" : "dry-run",
    auditPath: options.apply ? options.auditPath : null,
    ...summarize(results),
  }, null, 2));
  if (results.some((result) => result.status === "failed")) process.exitCode = 1;
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  main().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
