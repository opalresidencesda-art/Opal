import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { residentSubmissionSchema, unitCode } from "@/lib/validation";

export const runtime = "nodejs";

const fileSchema = z.object({
  key: z.string().regex(/^(responsibleKtp|familyCard|occupantKtp-\d{1,2})$/),
  name: z.string().min(1).max(240),
  type: z.string().regex(/^image\/(jpeg|png|webp|heic|heif)$/),
  size: z.number().int().min(1).max(10 * 1024 * 1024),
});

const bodySchema = z.object({
  values: residentSubmissionSchema,
  files: z.array(fileSchema).min(3).max(12),
});

function extensionFor(mime: string) {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/heic" ? "heic" : mime === "image/heif" ? "heif" : "jpg";
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Layanan pendataan belum dikonfigurasi." }, { status: 503 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data formulir tidak valid." }, { status: 422 });
  const { values, files } = parsed.data;
  if (values.website) return NextResponse.json({ error: "Pengiriman tidak dapat diproses." }, { status: 400 });

  const keys = files.map((file) => file.key);
  const occupantCount = keys.filter((key) => key.startsWith("occupantKtp-")).length;
  if (!keys.includes("responsibleKtp") || !keys.includes("familyCard") || occupantCount < 1 || occupantCount > 10 || new Set(keys).size !== keys.length) {
    return NextResponse.json({ error: "Unggahan KTP penanggung jawab, KTP penghuni, dan KK wajib lengkap." }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  const code = unitCode(values.gang, values.houseNumber);
  const { data: existingProperty, error: propertyLookupError } = await supabase
    .from("properties")
    .select("id")
    .eq("unit_code", code)
    .maybeSingle();
  if (propertyLookupError) return NextResponse.json({ error: "Unit rumah tidak dapat disiapkan." }, { status: 500 });

  const { data: property, error: propertyError } = existingProperty
    ? { data: existingProperty, error: null }
    : await supabase
      .from("properties")
      .insert({ unit_code: code, gang: values.gang, house_number: values.houseNumber.trim(), occupancy_status: values.houseStatus })
    .select("id")
    .single();
  if (propertyError || !property) return NextResponse.json({ error: "Unit rumah tidak dapat disiapkan." }, { status: 500 });

  const { data: submission, error: submissionError } = await supabase
    .from("resident_submissions")
    .insert({ property_id: property.id, payload: values, contact_email: values.email, status: "uploading" })
    .select("id")
    .single();
  if (submissionError || !submission) return NextResponse.json({ error: "Permohonan tidak dapat disiapkan." }, { status: 500 });

  const uploads = await Promise.all(files.map(async (file) => {
    const path = `submissions/${submission.id}/${file.key}.${extensionFor(file.type)}`;
    const { data, error } = await supabase.storage.from("resident-evidence").createSignedUploadUrl(path);
    if (error || !data) throw new Error("Unggahan privat tidak dapat disiapkan.");
    return { key: file.key, path, token: data.token };
  }));

  return NextResponse.json({ submissionId: submission.id, unitCode: code, uploads });
}
