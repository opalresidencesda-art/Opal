import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSafeReceipt } from "@/lib/email";
import { consumeRequestRateLimit, rateLimitHeaders, readJsonBody, requestBodyExceeds, requestHasSameOrigin, requestHasJsonContentType } from "@/lib/request";
import { isResidentEvidencePath } from "@/lib/storage-paths";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const evidenceSchema = z.object({
  key: z.string().regex(/^(responsibleKtp|familyCard|occupantKtp-\d{1,2})$/),
  path: z.string().min(10).max(500),
  name: z.string().min(1).max(240),
  type: z.string().regex(/^image\/(jpeg|png|webp|heic|heif)$/),
  size: z.number().int().min(1).max(10 * 1024 * 1024),
});

const bodySchema = z.object({ submissionId: z.string().uuid(), files: z.array(evidenceSchema).min(3).max(12) });

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Layanan pendataan belum dikonfigurasi." }, { status: 503 });
  if (requestBodyExceeds(request, 128 * 1024)) return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  if (!requestHasJsonContentType(request)) return NextResponse.json({ error: "Gunakan application/json." }, { status: 415 });
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Asal permintaan tidak diizinkan." }, { status: 403 });
  const rateLimit = consumeRequestRateLimit(request, "resident-complete", 10, 10 * 60_000);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Terlalu banyak penyelesaian pendataan. Coba lagi nanti." }, { status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) });
  const body = await readJsonBody(request);
  if (body === null) return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data unggahan tidak valid." }, { status: 422 });
  const { submissionId, files } = parsed.data;
  const folder = `submissions/${submissionId}/`;
  const keys = files.map((file) => file.key);
  const occupantCount = keys.filter((key) => key.startsWith("occupantKtp-")).length;
  if (
    files.some((file) => !isResidentEvidencePath(file.path, submissionId))
    || new Set(files.map((file) => file.path)).size !== files.length
    || new Set(keys).size !== keys.length
    || !keys.includes("responsibleKtp")
    || !keys.includes("familyCard")
    || occupantCount < 1
    || occupantCount > 10
  ) {
    return NextResponse.json({ error: "Berkas unggahan tidak cocok dengan permohonan." }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: submission, error: submissionError } = await supabase.from("resident_submissions").select("id,property_id,status,payload,contact_email,properties(unit_code)").eq("id", submissionId).single();
  if (submissionError || !submission || submission.status !== "uploading") return NextResponse.json({ error: "Permohonan tidak ditemukan atau telah diproses." }, { status: 404 });

  const { data: storedFiles, error: listError } = await supabase.storage.from("resident-evidence").list(folder, { limit: 20 });
  if (listError || !storedFiles || files.some((file) => !storedFiles.some((stored) => `${folder}${stored.name}` === file.path))) {
    return NextResponse.json({ error: "Sebagian berkas belum selesai diunggah. Silakan coba lagi." }, { status: 422 });
  }

  const evidence = files.map((file) => ({
    submission_id: submissionId,
    evidence_kind: file.key === "responsibleKtp" ? "responsible_ktp" : file.key === "familyCard" ? "family_card" : "occupant_ktp",
    storage_path: file.path,
    original_name: file.name,
    mime_type: file.type,
    byte_size: file.size,
  }));
  const { error: evidenceError } = await supabase.from("resident_evidence").insert(evidence);
  if (evidenceError) return NextResponse.json({ error: "Metadata berkas tidak dapat disimpan." }, { status: 500 });

  const { error: updateError } = await supabase.from("resident_submissions").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", submissionId);
  if (updateError) return NextResponse.json({ error: "Status permohonan tidak dapat diperbarui." }, { status: 500 });
  const propertyRecord = Array.isArray(submission.properties) ? submission.properties[0] : submission.properties;
  let receiptEmailSent = false;
  try {
    receiptEmailSent = (await sendSafeReceipt({
      to: submission.contact_email,
      unitCode: propertyRecord?.unit_code ?? "rumah OPAL",
      reference: submissionId,
      service: "pendataan warga",
    })).sent;
  } catch {
    receiptEmailSent = false;
  }
  return NextResponse.json({ ok: true, reference: submissionId, receiptEmailSent }, { headers: { "cache-control": "no-store" } });
}
