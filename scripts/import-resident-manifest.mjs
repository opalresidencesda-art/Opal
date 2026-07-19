#!/usr/bin/env node
/*
 * Import ulang pendataan Google Form dari manifest privat yang disiapkan RT.
 * Manifest JSON tidak boleh masuk Git. Satu item: { gang, houseNumber,
 * houseStatus, email, responsibleName, responsibleAddress, whatsapp,
 * headOfHouseholdName, headOfHouseholdOccupation, occupantsCount, evidence }.
 * evidence berisi { kind: responsible_ktp|occupant_ktp|family_card, file }.
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { basename, extname } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const manifestFile = process.env.OPAL_RESIDENT_MANIFEST;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const importedBy = process.env.OPAL_IMPORTER_EMAIL;
if (!manifestFile || !url || !key || !importedBy) throw new Error("Set OPAL_RESIDENT_MANIFEST, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan OPAL_IMPORTER_EMAIL.");
const bytes = readFileSync(manifestFile);
const hash = createHash("sha256").update(bytes).digest("hex");
const records = JSON.parse(bytes.toString("utf8"));
if (!Array.isArray(records)) throw new Error("Manifest harus berupa array JSON.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const sourceName = `resident-manifest:${basename(manifestFile)}`;
const { data: prior } = await supabase.from("source_imports").select("id").eq("source_name", sourceName).eq("source_sha256", hash).maybeSingle();
if (prior) { console.log("Manifest yang sama sudah diimpor; tidak ada perubahan."); process.exit(0); }
const { data: source, error: sourceError } = await supabase.from("source_imports").insert({ source_name: sourceName, source_sha256: hash, row_count: records.length, amount_total_rupiah: 0, imported_by: importedBy, notes: "Legacy Google Form resident import." }).select("id").single();
if (sourceError || !source) throw new Error(sourceError?.message ?? "Tidak dapat membuat source import.");
for (const record of records) {
  const gang = Number(record.gang);
  const houseNumber = String(record.houseNumber ?? "").trim();
  if (![1, 2, 3, 5].includes(gang) || !houseNumber) throw new Error("Gang atau nomor rumah tidak valid dalam manifest.");
  const unit = `OP ${gang} - ${houseNumber.padStart(2, "0")}`;
  const { data: property, error: propertyError } = await supabase.from("properties").upsert({ unit_code: unit, gang, house_number: houseNumber, occupancy_status: record.houseStatus ?? null }, { onConflict: "unit_code" }).select("id").single();
  if (propertyError || !property) throw new Error(`Gagal membuat rumah ${unit}.`);
  const payload = { ...record, website: "" };
  delete payload.evidence;
  const { data: submission, error: submissionError } = await supabase.from("resident_submissions").insert({ property_id: property.id, status: "approved", payload, contact_email: record.email, submitted_at: new Date().toISOString(), reviewed_at: new Date().toISOString(), reviewed_by: importedBy, admin_note: "Diimpor dari Google Form lama." }).select("id").single();
  if (submissionError || !submission) throw new Error(`Gagal membuat pendataan ${unit}.`);
  const { error: profileError } = await supabase.from("resident_profiles").upsert({ property_id: property.id, responsible_name: record.responsibleName, responsible_address: record.responsibleAddress, whatsapp: record.whatsapp, head_of_household_name: record.headOfHouseholdName, head_of_household_occupation: record.headOfHouseholdOccupation, occupants_count: Number(record.occupantsCount), contact_email: record.email }, { onConflict: "property_id" });
  if (profileError) throw new Error(`Gagal menyimpan profil ${unit}.`);
  for (const evidence of record.evidence ?? []) {
    const content = readFileSync(evidence.file);
    if (statSync(evidence.file).size > 10 * 1024 * 1024) throw new Error(`Berkas terlalu besar: ${evidence.file}`);
    const extension = extname(evidence.file).replace(".", "").toLowerCase();
    const path = `legacy/${submission.id}/${randomUUID()}.${extension}`;
    const mime = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
    const { error: uploadError } = await supabase.storage.from("resident-evidence").upload(path, content, { contentType: mime, upsert: false });
    if (uploadError) throw new Error(`Gagal mengunggah ${evidence.file}.`);
    const { error: evidenceError } = await supabase.from("resident_evidence").insert({ submission_id: submission.id, evidence_kind: evidence.kind, storage_path: path, original_name: basename(evidence.file), mime_type: mime, byte_size: content.length });
    if (evidenceError) throw new Error(`Gagal menyimpan metadata ${evidence.file}.`);
  }
}
console.log(`Impor pendataan selesai: ${records.length} rumah.`);
