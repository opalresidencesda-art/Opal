"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { renderOfficialDocument, type DocumentSettings } from "@/lib/documents";
import { formatDocumentNumber } from "@/lib/document-number";
import { sanitizeMarkdown } from "@/lib/markdown";
import { jakartaPeriod, KAS_OPAL_CONTRIBUTION_CATEGORY, isPeriodMonth } from "@/lib/monthly-dues";
import { isFloorPlanAssetPath } from "@/lib/storage-paths";
import { createAccessToken, hashAccessToken } from "@/lib/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { residentSubmissionSchema, unitCode } from "@/lib/validation";

function textValue(formData: FormData, key: string, required = true, max = 5_000) {
  const value = formData.get(key)?.toString().trim() ?? "";
  if (required && !value) throw new Error(`${key} wajib diisi.`);
  if (value.length > max) throw new Error(`${key} terlalu panjang.`);
  return value;
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function uuidValue(formData: FormData, key: string, required = true) {
  const value = textValue(formData, key, required);
  if (!value) return "";
  if (!z.string().uuid().safeParse(value).success) throw new Error(`${key} tidak valid.`);
  return value;
}

function isoDateValue(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} tidak valid.`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${label} tidak valid.`);
  return value;
}

function success(message: string, returnTo = "/admin") {
  revalidatePath("/");
  revalidatePath("/panduan-harmonis");
  revalidatePath("/layanan");
  revalidatePath("/kas");
  revalidatePath("/admin");
  revalidatePath("/admin/kas");
  revalidatePath("/admin/peta-rumah");
  const safeReturnTo = /^\/admin(?:\/|$)/.test(returnTo) ? returnTo : "/admin";
  const destination = new URL(safeReturnTo, "https://opal.local");
  destination.searchParams.set("message", message);
  redirect(`${destination.pathname}${destination.search}${destination.hash}`);
}

const mapPropertySchema = z.object({
  propertyId: z.string().uuid().optional(),
  gang: z.coerce.number().int().refine((value) => [1, 2, 3, 5].includes(value), "Gang tidak valid."),
  houseNumber: z.string().trim().toUpperCase().regex(/^[0-9]{1,3}$/, "Nomor rumah tidak valid."),
  occupancyStatus: z.enum(["self", "relative", "tenant", "vacant_rent", "vacant_sale"]).nullable(),
});

const mapProfileSchema = z.object({
  responsibleName: z.string().trim().min(2, "Nama penanggung jawab wajib diisi."),
  responsibleAddress: z.string().trim().min(5, "Alamat wajib diisi."),
  whatsapp: z.string().trim().regex(/^08\d{8,13}$/, "Nomor WhatsApp tidak valid."),
  headOfHouseholdName: z.string().trim().min(2, "Nama kepala keluarga wajib diisi."),
  headOfHouseholdOccupation: z.enum(["employee", "entrepreneur", "student"]),
  occupantsCount: z.coerce.number().int().min(1).max(30),
  contactEmail: z.string().trim().email("Email tidak valid."),
});

export async function signInAdmin(formData: FormData) {
  if (!isSupabaseConfigured() || !supabaseUrl || !supabasePublishableKey) redirect("/admin/login?reason=setup");
  const email = textValue(formData, "email").toLowerCase();
  const password = textValue(formData, "password", true, 256);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?reason=credentials");

  const { data: admin, error: adminError } = await supabase.from("admin_users").select("email").eq("email", email).maybeSingle();
  if (adminError || !admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?reason=forbidden");
  }

  redirect("/admin");
}

export async function addAdminUser(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = textValue(formData, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email pengurus tidak valid.");
  const { error } = await supabase.from("admin_users").insert({ email });
  if (error) throw new Error("Email pengurus tidak dapat ditambahkan. Periksa apakah email sudah terdaftar.");
  success("Email pengurus telah diberi akses admin. Buat akun email/password-nya di Supabase Authentication bila belum ada.");
}

export async function removeAdminUser(formData: FormData) {
  const { supabase, email: currentEmail } = await requireAdmin();
  const email = textValue(formData, "email").toLowerCase();
  if (email === currentEmail) throw new Error("Untuk keamanan, Anda tidak dapat mencabut akses akun yang sedang dipakai.");
  const { count, error: countError } = await supabase.from("admin_users").select("email", { count: "exact", head: true });
  if (countError) throw new Error("Daftar pengurus tidak dapat diperiksa.");
  if ((count ?? 0) <= 1) throw new Error("Setidaknya satu akun admin harus tetap aktif.");
  const { error } = await supabase.from("admin_users").delete().eq("email", email);
  if (error) throw new Error("Akses pengurus tidak dapat dicabut.");
  success("Akses admin pengurus telah dicabut.");
}

export async function saveFeeSchedule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const label = textValue(formData, "label");
  const amountRupiah = Number(textValue(formData, "amountRupiah"));
  const effectiveFrom = isoDateValue(textValue(formData, "effectiveFrom"), "Tanggal mulai iuran");
  if (!Number.isInteger(amountRupiah) || amountRupiah < 1 || amountRupiah > 10_000_000) throw new Error("Nominal iuran tidak valid.");
  const { error } = await supabase.rpc("activate_fee_schedule", {
    p_label: label,
    p_amount_rupiah: amountRupiah,
    p_payment_method: textValue(formData, "paymentMethod"),
    p_destination: textValue(formData, "destination", false),
    p_description: textValue(formData, "description", false),
    p_effective_from: effectiveFrom,
  });
  if (error) throw new Error("Iuran tidak dapat disimpan. Pastikan skema Supabase sudah diterapkan.");
  success("Jadwal iuran baru telah aktif.");
}

export async function saveAnnouncement(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id", false);
  const title = textValue(formData, "title");
  const imageAlt = textValue(formData, "imageAlt", false).slice(0, 200);
  const removeImage = boolValue(formData, "removeImage");
  const existingResult = id
    ? await supabase.from("announcements").select("image_path,image_alt").eq("id", id).maybeSingle()
    : { data: null, error: null };
  if (existingResult.error || (id && !existingResult.data)) throw new Error("Pengumuman yang akan diubah tidak ditemukan.");

  const existingImagePath = typeof existingResult.data?.image_path === "string" ? existingResult.data.image_path : null;
  const existingImageAlt = typeof existingResult.data?.image_alt === "string" ? existingResult.data.image_alt : "";
  const candidate = formData.get("image");
  let uploadedImagePath: string | null = null;
  if (candidate && typeof candidate === "object" && "size" in candidate && "type" in candidate && Number(candidate.size) > 0) {
    const image = candidate as File;
    if (image.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      throw new Error("Gambar harus berupa JPG, PNG, atau WEBP maksimal 5 MB.");
    }
    const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
    uploadedImagePath = `announcements/${randomUUID()}.${extension}`;
    const { error: uploadError } = await createSupabaseAdminClient().storage.from("opal-assets").upload(uploadedImagePath, Buffer.from(await image.arrayBuffer()), { contentType: image.type, upsert: false });
    if (uploadError) throw new Error("Gambar pengumuman tidak dapat diunggah.");
  }

  const imagePath = uploadedImagePath ?? (removeImage ? null : existingImagePath);
  const payload = {
    title,
    body: textValue(formData, "body"),
    published_at: isoDateValue(textValue(formData, "publishedAt"), "Tanggal publikasi"),
    pinned: boolValue(formData, "pinned"),
    published: boolValue(formData, "published"),
    image_path: imagePath,
    image_alt: imagePath ? imageAlt || existingImageAlt || title : "",
  };
  const query = id ? supabase.from("announcements").update(payload).eq("id", id) : supabase.from("announcements").insert(payload);
  const { error } = await query;
  if (error) {
    if (uploadedImagePath) await createSupabaseAdminClient().storage.from("opal-assets").remove([uploadedImagePath]);
    throw new Error("Pengumuman tidak dapat disimpan. Pastikan schema image pengumuman sudah diterapkan.");
  }
  const oldImagePath = existingImagePath && existingImagePath !== imagePath && /^announcements\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(existingImagePath) ? existingImagePath : null;
  if (oldImagePath) await createSupabaseAdminClient().storage.from("opal-assets").remove([oldImagePath]);
  success("Pengumuman telah disimpan.");
}

export async function saveResource(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id", false);
  const category = textValue(formData, "category");
  const validCategories = ["Keuangan", "Surat", "Data warga", "Fasilitas", "Rumah"];
  if (!validCategories.includes(category)) throw new Error("Kategori layanan tidak valid.");
  const sortOrder = Number(textValue(formData, "sortOrder"));
  if (!Number.isInteger(sortOrder) || sortOrder < 1) throw new Error("Urutan layanan tidak valid.");
  const href = textValue(formData, "href", true, 1_000);
  let parsedHref: URL;
  try {
    parsedHref = new URL(href);
  } catch {
    throw new Error("Tautan layanan tidak valid.");
  }
  if (!['http:', 'https:'].includes(parsedHref.protocol)) throw new Error("Tautan layanan harus menggunakan HTTP atau HTTPS.");
  const payload = {
    title: textValue(formData, "title"),
    description: textValue(formData, "description"),
    href: parsedHref.toString(),
    category,
    requires_google_login: boolValue(formData, "requiresGoogleLogin"),
    published: boolValue(formData, "published"),
    sort_order: sortOrder,
  };
  const query = id ? supabase.from("resources").update(payload).eq("id", id) : supabase.from("resources").insert(payload);
  const { error } = await query;
  if (error) throw new Error("Tautan layanan tidak dapat disimpan.");
  success("Tautan layanan telah disimpan.");
}

export async function saveGuideSection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const sortOrder = Number(textValue(formData, "sortOrder"));
  if (!Number.isInteger(sortOrder) || sortOrder < 1) throw new Error("Urutan panduan tidak valid.");
  const { error } = await supabase.from("guide_sections").update({
    title: textValue(formData, "title"),
    summary: textValue(formData, "summary"),
    body_markdown: sanitizeMarkdown(textValue(formData, "bodyMarkdown")),
    sort_order: sortOrder,
    published: boolValue(formData, "published"),
  }).eq("id", id);
  if (error) throw new Error("Bagian panduan tidak dapat disimpan.");
  success("Bagian panduan telah disimpan.");
}

export async function saveDocumentSettings(formData: FormData) {
  const { supabase, email } = await requireAdmin();
  const payload = {
    id: true,
    signer_name: textValue(formData, "signerName", false),
    signer_title: textValue(formData, "signerTitle", false),
    rt_number: textValue(formData, "rtNumber", false),
    rw_number: textValue(formData, "rwNumber", false),
    kelurahan: textValue(formData, "kelurahan", false),
    kecamatan: textValue(formData, "kecamatan", false),
    kabupaten: textValue(formData, "kabupaten", false),
    provinsi: textValue(formData, "provinsi", false),
    city: textValue(formData, "city", false),
    number_format: textValue(formData, "numberFormat", false),
    enabled: boolValue(formData, "enabled"),
    updated_by: email,
  };
  if (payload.enabled && Object.entries(payload).filter(([key]) => ["signer_name", "signer_title", "rt_number", "rw_number", "kelurahan", "kecamatan", "kabupaten", "provinsi", "city", "number_format"].includes(key)).some(([, value]) => !value)) {
    throw new Error("Lengkapi identitas penerbit dan format nomor sebelum membuka penerbitan.");
  }
  if (payload.enabled && !payload.number_format.includes("{number}")) throw new Error("Format nomor wajib memuat {number}.");
  const { error } = await supabase.from("document_settings").upsert(payload, { onConflict: "id" });
  if (error) throw new Error("Pengaturan surat tidak dapat disimpan.");
  success(payload.enabled ? "Penerbitan surat telah dibuka." : "Penerbitan surat tetap terkunci.");
}

export async function reviewResidentSubmission(formData: FormData) {
  const { supabase, email } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const status = textValue(formData, "status");
  if (!["in_review", "needs_revision", "approved", "rejected"].includes(status)) throw new Error("Status pendataan tidak valid.");
  const note = textValue(formData, "adminNote", false);
  const { data: submission, error: lookupError } = await supabase.from("resident_submissions").select("payload").eq("id", id).single();
  if (lookupError || !submission) throw new Error("Pendataan tidak ditemukan.");
  const reviewedAt = new Date().toISOString();
  let approvalValues: Record<string, string | number | null> = {};
  if (status === "approved") {
    const parsed = residentSubmissionSchema.safeParse(submission.payload);
    if (!parsed.success) throw new Error("Data pendataan tidak memenuhi format saat ini.");
    const values = parsed.data;
    approvalValues = {
      p_responsible_name: values.responsibleName,
      p_responsible_address: values.responsibleAddress,
      p_whatsapp: values.whatsapp,
      p_head_of_household_name: values.headOfHouseholdName,
      p_head_of_household_occupation: values.headOfHouseholdOccupation,
      p_occupants_count: values.occupantsCount,
      p_contact_email: values.email,
      p_occupancy_status: values.houseStatus,
    };
  }
  const { error } = await supabase.rpc("review_resident_submission", {
    p_id: id,
    p_status: status,
    p_admin_note: note || null,
    p_reviewed_by: email,
    p_reviewed_at: reviewedAt,
    ...approvalValues,
  });
  if (error) throw new Error("Status pendataan tidak dapat disimpan.");
  success("Status pendataan warga telah diperbarui.");
}

export async function reviewServiceRequest(formData: FormData) {
  const { supabase, email } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const status = textValue(formData, "status");
  if (!["in_review", "needs_revision", "approved", "rejected"].includes(status)) throw new Error("Status surat tidak valid.");
  const { error } = await supabase.rpc("review_service_request_status", {
    p_id: id,
    p_status: status,
    p_admin_note: textValue(formData, "adminNote", false) || null,
    p_reviewed_by: email,
    p_reviewed_at: new Date().toISOString(),
  });
  if (error) throw new Error("Status permohonan tidak dapat disimpan.");
  success("Status permohonan surat telah diperbarui.");
}

export async function issueServiceRequest(formData: FormData) {
  const { supabase, email } = await requireAdmin();
  const requestId = uuidValue(formData, "id");
  const { data: requestRow, error: requestError } = await supabase.from("service_requests").select("id,request_type,status,payload").eq("id", requestId).single();
  if (requestError || !requestRow) throw new Error("Permohonan surat tidak ditemukan.");
  if (requestRow.status !== "approved") throw new Error("Hanya permohonan yang telah disetujui dapat diterbitkan.");
  const { data: existing } = await supabase.from("document_issuances").select("id").eq("request_id", requestId).maybeSingle();
  if (existing) throw new Error("Surat ini sudah diterbitkan.");
  const { data: rawSettings, error: settingsError } = await supabase.from("document_settings").select("*").eq("id", true).maybeSingle();
  if (settingsError || !rawSettings) throw new Error("Lengkapi pengaturan penerbit surat lebih dahulu.");
  const settings: DocumentSettings = {
    signerName: rawSettings.signer_name,
    signerTitle: rawSettings.signer_title,
    rtNumber: rawSettings.rt_number,
    rwNumber: rawSettings.rw_number,
    kelurahan: rawSettings.kelurahan,
    kecamatan: rawSettings.kecamatan,
    kabupaten: rawSettings.kabupaten,
    provinsi: rawSettings.provinsi,
    city: rawSettings.city,
    numberFormat: rawSettings.number_format,
    enabled: rawSettings.enabled,
  };
  if (!settings.enabled || Object.values(settings).slice(0, -1).some((value) => !value)) throw new Error("Penerbitan masih terkunci atau konfigurasi surat belum lengkap.");
  const issuedAt = new Date();
  const year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jakarta" }).format(issuedAt));
  const { data: serial, error: serialError } = await supabase.rpc("next_document_serial", { p_type: requestRow.request_type, p_year: year });
  if (serialError || !Number.isInteger(serial)) throw new Error("Nomor urut surat tidak dapat dibuat.");
  const type = requestRow.request_type as "move" | "domicile" | "single";
  const number = formatDocumentNumber(settings.numberFormat, type, serial, year);
  const bytes = await renderOfficialDocument({ type, number, issuedAt, settings, payload: requestRow.payload as Record<string, unknown> });
  const storagePath = `issued/${requestId}.pdf`;
  const adminStorage = createSupabaseAdminClient();
  const { error: uploadError } = await adminStorage.storage.from("document-exports").upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw new Error("PDF surat tidak dapat disimpan secara privat.");
  const { error: issuanceError } = await supabase.rpc("finalize_document_issuance", {
    p_request_id: requestId,
    p_serial: serial,
    p_year: year,
    p_document_number: number,
    p_storage_path: storagePath,
    p_snapshot: { settings, payload: requestRow.payload },
    p_issued_by: email,
    p_issued_at: issuedAt.toISOString(),
  });
  if (issuanceError) {
    await adminStorage.storage.from("document-exports").remove([storagePath]);
    throw new Error("Arsip penerbitan surat tidak dapat dibuat.");
  }
  success("PDF surat resmi telah diterbitkan dan diarsipkan privat.");
}

export async function revokePropertyLink(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id");
  const { error } = await supabase.from("properties").update({ access_token_revoked_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Tautan rumah tidak dapat dicabut.");
  success("Tautan privat rumah telah dicabut.");
}

export async function createProperty(formData: FormData) {
  const { supabase } = await requireAdmin();
  const gang = Number(textValue(formData, "gang"));
  const houseNumber = textValue(formData, "houseNumber").toUpperCase();
  if (![1, 2, 3, 5].includes(gang) || !/^[0-9A-Z/-]{1,8}$/.test(houseNumber)) throw new Error("Gang atau nomor rumah tidak valid.");
  const { error } = await supabase.from("properties").insert({
    unit_code: unitCode(gang, houseNumber),
    gang,
    house_number: houseNumber,
  });
  if (error) throw new Error("Rumah tidak dapat ditambahkan. Periksa apakah unit tersebut sudah ada.");
  success("Rumah telah ditambahkan. Buat tautan privat bila ingin membagikan akses ke warga.");
}

export async function savePropertyProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const property = mapPropertySchema.parse({
    propertyId: uuidValue(formData, "propertyId", false) || undefined,
    gang: textValue(formData, "gang"),
    houseNumber: textValue(formData, "houseNumber"),
    occupancyStatus: textValue(formData, "occupancyStatus", false) || null,
  });
  const profileInput = {
    responsibleName: textValue(formData, "responsibleName", false),
    responsibleAddress: textValue(formData, "responsibleAddress", false),
    whatsapp: textValue(formData, "whatsapp", false),
    headOfHouseholdName: textValue(formData, "headOfHouseholdName", false),
    headOfHouseholdOccupation: textValue(formData, "headOfHouseholdOccupation", false),
    occupantsCount: textValue(formData, "occupantsCount", false),
    contactEmail: textValue(formData, "contactEmail", false),
  };
  const profileProvided = Object.values(profileInput).some(Boolean);
  const parsedProfile = profileProvided ? mapProfileSchema.parse(profileInput) : null;
  const nextUnitCode = unitCode(property.gang, property.houseNumber);
  let propertyId = property.propertyId;

  if (propertyId) {
    const { error } = await supabase.from("properties").update({
      unit_code: nextUnitCode,
      gang: property.gang,
      house_number: property.houseNumber,
      occupancy_status: property.occupancyStatus,
    }).eq("id", propertyId);
    if (error) throw new Error("Rumah tidak dapat diperbarui. Pastikan kode unit belum dipakai.");
  } else {
    const { data, error } = await supabase.from("properties").insert({
      unit_code: nextUnitCode,
      gang: property.gang,
      house_number: property.houseNumber,
      occupancy_status: property.occupancyStatus,
    }).select("id").single();
    if (error || !data) throw new Error("Rumah tidak dapat ditambahkan. Pastikan kode unit belum dipakai.");
    propertyId = data.id;
  }

  if (parsedProfile && propertyId) {
    const { error } = await supabase.from("resident_profiles").upsert({
      property_id: propertyId,
      responsible_name: parsedProfile.responsibleName,
      responsible_address: parsedProfile.responsibleAddress,
      whatsapp: parsedProfile.whatsapp,
      head_of_household_name: parsedProfile.headOfHouseholdName,
      head_of_household_occupation: parsedProfile.headOfHouseholdOccupation,
      occupants_count: parsedProfile.occupantsCount,
      contact_email: parsedProfile.contactEmail,
    }, { onConflict: "property_id" });
    if (error) throw new Error("Profil keluarga tidak dapat disimpan.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/peta-rumah");
  return { propertyId, unitCode: nextUnitCode, message: parsedProfile ? "Data rumah dan keluarga tersimpan." : "Rumah tersimpan. Isi data keluarga saat sudah tersedia." };
}

export async function createPropertyMapLink(propertyId: string) {
  const { supabase } = await requireAdmin();
  if (!z.string().uuid().safeParse(propertyId).success) throw new Error("Rumah tidak valid.");
  const token = createAccessToken();
  const { error } = await supabase.from("properties").update({
    access_token_hash: hashAccessToken(token),
    access_token_created_at: new Date().toISOString(),
    access_token_revoked_at: null,
  }).eq("id", propertyId);
  if (error) throw new Error("Tautan privat rumah tidak dapat dibuat.");
  revalidatePath("/admin");
  revalidatePath("/admin/peta-rumah");
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return { url: `${base}/rumah/${token}` };
}

const propertyMapPositionSchema = z.object({
  propertyId: z.string().uuid(),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export async function savePropertyMapPosition(input: unknown) {
  const { supabase, email } = await requireAdmin();
  const values = propertyMapPositionSchema.parse(input);
  const { error } = await supabase.from("property_map_positions").upsert({
    property_id: values.propertyId,
    latitude: values.latitude,
    longitude: values.longitude,
    calibrated_by: email,
    calibrated_at: new Date().toISOString(),
  }, { onConflict: "property_id" });
  if (error) throw new Error("Posisi rumah belum dapat disimpan. Pastikan skema Atlas sudah diterapkan.");
  revalidatePath("/admin/peta-rumah");
  return { message: "Posisi rumah pada peta telah disimpan." };
}

export async function removePropertyMapPosition(propertyId: string) {
  const { supabase } = await requireAdmin();
  if (!z.string().uuid().safeParse(propertyId).success) throw new Error("Rumah tidak valid.");
  const { error } = await supabase.from("property_map_positions").delete().eq("property_id", propertyId);
  if (error) throw new Error("Posisi rumah belum dapat dihapus.");
  revalidatePath("/admin/peta-rumah");
  return { message: "Posisi rumah telah dihapus dari peta." };
}

export async function saveCashTransaction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id", false);
  const returnTo = textValue(formData, "returnTo", false) || "/admin";
  const amount = Number(textValue(formData, "amountRupiah"));
  const direction = textValue(formData, "direction");
  const transactionDate = isoDateValue(textValue(formData, "transactionDate"), "Tanggal transaksi");
  const category = textValue(formData, "category");
  const description = textValue(formData, "description", false);
  if (category.length > 120) throw new Error("Kategori transaksi terlalu panjang.");
  if (description.length > 500) throw new Error("Keterangan transaksi terlalu panjang.");
  if (!Number.isInteger(amount) || amount < 1 || amount > 1_000_000_000) throw new Error("Nominal Kas tidak valid.");
  if (direction !== "income" && direction !== "expense") throw new Error("Arah transaksi tidak valid.");
  const payload = {
    transaction_date: transactionDate,
    category,
    description,
    direction,
    amount_rupiah: amount,
    is_public: boolValue(formData, "isPublic"),
  };
  if (id) {
    const { error } = await supabase.rpc("update_cash_transaction_with_revision", {
      p_id: id,
      p_transaction_date: payload.transaction_date,
      p_category: payload.category,
      p_description: payload.description,
      p_direction: payload.direction,
      p_amount_rupiah: payload.amount_rupiah,
      p_is_public: payload.is_public,
    });
    if (error) throw new Error("Koreksi transaksi Kas tidak dapat disimpan beserta riwayatnya.");
    return success("Koreksi transaksi Kas telah disimpan beserta riwayat sebelumnya.", returnTo);
  }
  const { error } = await supabase.from("cash_transactions").insert(payload);
  if (error) throw new Error("Transaksi Kas tidak dapat disimpan.");
  success("Transaksi Kas telah disimpan.", returnTo);
}

export async function savePropertyContribution(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id", false);
  const amount = Number(textValue(formData, "amountRupiah"));
  const status = textValue(formData, "status");
  const periodMonth = textValue(formData, "periodMonth");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodMonth)) throw new Error("Periode iuran tidak valid.");
  if (!Number.isInteger(amount) || amount < 1 || amount > 10_000_000) throw new Error("Nominal iuran rumah tidak valid.");
  if (!['paid', 'pending', 'waived'].includes(status)) throw new Error("Status iuran rumah tidak valid.");
  const paidAtValue = textValue(formData, "paidAt", false);
  if (status === "paid" && !paidAtValue) throw new Error("Tanggal pembayaran wajib diisi untuk status sudah dibayar.");
  const paidAt = status === "paid" ? isoDateValue(paidAtValue, "Tanggal pembayaran") : null;
  const payload = {
    category: textValue(formData, "category", true, 120),
    period: `${periodMonth}-01`,
    amount_rupiah: amount,
    paid_at: paidAt,
    status,
  };
  if (id) {
    const { error } = await supabase.from("property_contributions").update(payload).eq("id", id);
    if (error) throw new Error("Catatan iuran rumah tidak dapat diperbarui.");
    return success("Catatan iuran rumah telah diperbarui.");
  }
  const unitCodeInput = textValue(formData, "unitCode").toUpperCase();
  const { data: property, error: propertyError } = await supabase.from("properties").select("id").eq("unit_code", unitCodeInput).maybeSingle();
  if (propertyError || !property) throw new Error("Unit rumah tidak ditemukan. Pilih unit dari daftar.");
  const { error } = await supabase.from("property_contributions").insert({ ...payload, property_id: property.id, source_reference: "manual" });
  if (error) throw new Error("Catatan iuran rumah tidak dapat disimpan. Periksa apakah periode yang sama sudah dicatat.");
  success("Catatan iuran rumah telah disimpan.");
}

export async function prepareMonthlyContributions(formData: FormData) {
  const { supabase } = await requireAdmin();
  const category = textValue(formData, "category");
  const amount = Number(textValue(formData, "amountRupiah"));
  const periodMonth = textValue(formData, "periodMonth");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodMonth)) throw new Error("Periode iuran tidak valid.");
  if (!Number.isInteger(amount) || amount < 1 || amount > 10_000_000) throw new Error("Nominal iuran rumah tidak valid.");
  const period = `${periodMonth}-01`;
  const [{ data: properties, error: propertiesError }, { data: existing, error: existingError }] = await Promise.all([
    supabase.from("properties").select("id").eq("active", true),
    supabase.from("property_contributions").select("property_id").eq("category", category).eq("period", period),
  ]);
  if (propertiesError || existingError) throw new Error("Data rumah atau iuran tidak dapat dimuat.");
  if (!properties?.length) throw new Error("Belum ada rumah aktif untuk dibuatkan iuran.");
  const existingPropertyIds = new Set((existing ?? []).map((item) => item.property_id));
  const sourceReference = `dashboard-bulk:${periodMonth}:${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const rows = properties.filter((property) => !existingPropertyIds.has(property.id)).map((property) => ({
    property_id: property.id,
    category,
    period,
    amount_rupiah: amount,
    status: "pending",
    source_reference: sourceReference,
  }));
  if (!rows.length) return success("Iuran untuk periode ini sudah tercatat pada semua rumah aktif.");
  const { error } = await supabase.from("property_contributions").upsert(rows, {
    onConflict: "property_id,category,period,amount_rupiah,source_reference",
    ignoreDuplicates: true,
  });
  if (error) throw new Error("Tagihan iuran belum dapat disiapkan.");
  success(`${rows.length} tagihan iuran berstatus belum dibayar telah disiapkan.`);
}

export async function prepareKasMonthlyContributions(formData: FormData) {
  const { supabase } = await requireAdmin();
  const periodMonth = textValue(formData, "periodMonth");
  const returnTo = textValue(formData, "returnTo", false) || "/admin/kas";
  if (!isPeriodMonth(periodMonth)) throw new Error("Periode iuran Kas tidak valid.");
  if (periodMonth !== jakartaPeriod()) throw new Error("Tagihan Iuran Kas OPAL hanya dapat disiapkan untuk bulan berjalan.");

  const [{ data: fee, error: feeError }, { data: properties, error: propertiesError }, { data: existing, error: existingError }] = await Promise.all([
    supabase.from("fee_schedules").select("amount_rupiah").eq("label", KAS_OPAL_CONTRIBUTION_CATEGORY).eq("is_active", true).maybeSingle(),
    supabase.from("properties").select("id").eq("active", true),
    supabase.from("property_contributions").select("property_id").eq("category", KAS_OPAL_CONTRIBUTION_CATEGORY).eq("period", `${periodMonth}-01`),
  ]);
  if (feeError || !fee || !Number.isInteger(fee.amount_rupiah) || fee.amount_rupiah < 1) throw new Error("Tarif Iuran Kas OPAL aktif belum tersedia.");
  if (propertiesError || existingError) throw new Error("Data rumah atau tagihan iuran Kas tidak dapat dimuat.");
  if (!properties?.length) throw new Error("Belum ada rumah aktif untuk disiapkan tagihannya.");

  const existingPropertyIds = new Set((existing ?? []).map((item) => item.property_id));
  const rows = properties.filter((property) => !existingPropertyIds.has(property.id)).map((property) => ({
    property_id: property.id,
    category: KAS_OPAL_CONTRIBUTION_CATEGORY,
    period: `${periodMonth}-01`,
    amount_rupiah: fee.amount_rupiah,
    status: "pending",
    source_reference: `kas-monthly:${periodMonth}`,
  }));
  if (!rows.length) return success("Tagihan Iuran Kas OPAL bulan ini sudah tersedia untuk semua rumah aktif.", returnTo);
  const { error } = await supabase.from("property_contributions").upsert(rows, {
    onConflict: "property_id,category,period,amount_rupiah,source_reference",
    ignoreDuplicates: true,
  });
  if (error) throw new Error("Tagihan Iuran Kas OPAL belum dapat disiapkan.");
  success(`${rows.length} tagihan Iuran Kas OPAL bulan ini telah disiapkan sebagai belum dibayar.`, returnTo);
}

export async function updateKasContributionStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = textValue(formData, "id");
  const status = textValue(formData, "status");
  const returnTo = textValue(formData, "returnTo", false) || "/admin/kas";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Catatan iuran Kas tidak valid.");
  if (!['paid', 'pending', 'waived'].includes(status)) throw new Error("Status iuran Kas tidak valid.");
  const paidAt = status === "paid" ? textValue(formData, "paidAt") : null;
  if (paidAt) isoDateValue(paidAt, "Tanggal pembayaran");

  const { data: contribution, error: lookupError } = await supabase.from("property_contributions").select("id,category").eq("id", id).maybeSingle();
  if (lookupError || !contribution || contribution.category !== KAS_OPAL_CONTRIBUTION_CATEGORY) throw new Error("Catatan Iuran Kas OPAL tidak ditemukan.");
  const { error } = await supabase.from("property_contributions").update({ status, paid_at: paidAt }).eq("id", id);
  if (error) throw new Error("Status pembayaran Iuran Kas OPAL tidak dapat disimpan.");
  const message = status === "paid" ? "Pembayaran Iuran Kas OPAL telah dicatat." : status === "waived" ? "Iuran Kas OPAL ditandai dibebaskan." : "Iuran Kas OPAL dikembalikan ke status belum dibayar.";
  success(message, returnTo);
}

export async function saveStaffProfile(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id", false);
  const sortOrder = Number(textValue(formData, "sortOrder"));
  if (!Number.isInteger(sortOrder) || sortOrder < 1) throw new Error("Urutan petugas tidak valid.");
  const existingResult = id
    ? await supabase.from("staff_profiles").select("photo_path").eq("id", id).maybeSingle()
    : { data: null, error: null };
  if (existingResult.error || (id && !existingResult.data)) throw new Error("Profil petugas yang akan diubah tidak ditemukan.");
  const existingPhotoPath = typeof existingResult.data?.photo_path === "string" ? existingResult.data.photo_path : null;
  const candidate = formData.get("photo");
  let uploadedPhotoPath: string | null = null;
  if (candidate && typeof candidate === "object" && "arrayBuffer" in candidate && "size" in candidate && "type" in candidate && candidate.size > 0) {
    const photo = candidate as File;
    if (photo.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) throw new Error("Foto harus berupa JPG, PNG, atau WEBP maksimal 5 MB.");
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    uploadedPhotoPath = `staff/${randomUUID()}.${extension}`;
    const { error: uploadError } = await createSupabaseAdminClient().storage.from("opal-assets").upload(uploadedPhotoPath, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type, upsert: false });
    if (uploadError) throw new Error("Foto profil tidak dapat diunggah.");
  }
  const photoPath = uploadedPhotoPath ?? (boolValue(formData, "removePhoto") ? null : existingPhotoPath);
  const payload = { name: textValue(formData, "name"), role: textValue(formData, "role"), whatsapp: textValue(formData, "whatsapp", false) || null, photo_path: photoPath, published: boolValue(formData, "published"), sort_order: sortOrder };
  const { error } = id ? await supabase.from("staff_profiles").update(payload).eq("id", id) : await supabase.from("staff_profiles").insert(payload);
  if (error) {
    if (uploadedPhotoPath) await createSupabaseAdminClient().storage.from("opal-assets").remove([uploadedPhotoPath]);
    throw new Error("Profil petugas tidak dapat disimpan.");
  }
  const oldPhotoPath = existingPhotoPath && existingPhotoPath !== photoPath && /^staff\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(existingPhotoPath) ? existingPhotoPath : null;
  if (oldPhotoPath) await createSupabaseAdminClient().storage.from("opal-assets").remove([oldPhotoPath]);
  revalidatePath("/petugas");
  success("Profil petugas telah disimpan.");
}

export async function saveHomeSpec(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id", false);
  const category = textValue(formData, "category");
  const sortOrder = Number(textValue(formData, "sortOrder"));
  if (!["Keramik", "Cat", "Kontak"].includes(category) || !Number.isInteger(sortOrder) || sortOrder < 1) throw new Error("Spesifikasi rumah tidak valid.");
  const payload = { category, label: textValue(formData, "label"), value: textValue(formData, "value"), published: boolValue(formData, "published"), sort_order: sortOrder };
  const { error } = id ? await supabase.from("home_specs").update(payload).eq("id", id) : await supabase.from("home_specs").insert(payload);
  if (error) throw new Error("Spesifikasi rumah tidak dapat disimpan.");
  revalidatePath("/spesifikasi-rumah");
  success("Spesifikasi rumah telah disimpan.");
}

export async function saveFloorPlanAsset(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuidValue(formData, "id", false);
  const file = formData.get("file");
  const sortOrder = Number(textValue(formData, "sortOrder"));
  if (!Number.isInteger(sortOrder) || sortOrder < 1) throw new Error("Urutan denah tidak valid.");
  const existingResult = id
    ? await supabase.from("floor_plan_assets").select("storage_path").eq("id", id).maybeSingle()
    : { data: null, error: null };
  if (existingResult.error || (id && !existingResult.data)) throw new Error("Aset denah yang akan diubah tidak ditemukan.");
  const existingStoragePath = typeof existingResult.data?.storage_path === "string" ? existingResult.data.storage_path : null;
  let storagePath = existingStoragePath ?? "";
  let uploadedStoragePath: string | null = null;
  if (file && typeof file === "object" && "arrayBuffer" in file && "size" in file && "type" in file && file.size > 0) {
    const upload = file as File;
    if (upload.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(upload.type)) throw new Error("Denah harus berupa JPG, PNG, atau WEBP maksimal 5 MB.");
    const extension = upload.type === "image/png" ? "png" : upload.type === "image/webp" ? "webp" : "jpg";
    uploadedStoragePath = `floor-plans/${randomUUID()}.${extension}`;
    storagePath = uploadedStoragePath;
    const { error: uploadError } = await createSupabaseAdminClient().storage.from("opal-assets").upload(storagePath, Buffer.from(await upload.arrayBuffer()), { contentType: upload.type, upsert: false });
    if (uploadError) throw new Error("Berkas denah tidak dapat diunggah.");
  }
  if (!storagePath) throw new Error("Unggah berkas denah terlebih dahulu.");
  if (!isFloorPlanAssetPath(storagePath)) {
    if (uploadedStoragePath) await createSupabaseAdminClient().storage.from("opal-assets").remove([uploadedStoragePath]);
    throw new Error("Path denah tidak valid.");
  }
  const payload = { title: textValue(formData, "title"), alt_text: textValue(formData, "altText"), storage_path: storagePath, published: boolValue(formData, "published"), sort_order: sortOrder };
  const { error } = id ? await supabase.from("floor_plan_assets").update(payload).eq("id", id) : await supabase.from("floor_plan_assets").insert(payload);
  if (error) {
    if (uploadedStoragePath) await createSupabaseAdminClient().storage.from("opal-assets").remove([uploadedStoragePath]);
    throw new Error("Aset denah tidak dapat disimpan.");
  }
  const oldStoragePath = existingStoragePath && existingStoragePath !== storagePath && isFloorPlanAssetPath(existingStoragePath) ? existingStoragePath : null;
  if (oldStoragePath) await createSupabaseAdminClient().storage.from("opal-assets").remove([oldStoragePath]);
  revalidatePath("/denah");
  success("Aset denah telah disimpan.");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
