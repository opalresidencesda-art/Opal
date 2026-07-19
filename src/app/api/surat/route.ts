import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSafeReceipt } from "@/lib/email";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { documentRequestTypes, requestSchemaFor, unitCode } from "@/lib/validation";

export const runtime = "nodejs";

const envelopeSchema = z.object({ type: z.enum(documentRequestTypes), values: z.record(z.string(), z.unknown()) });

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ error: "Layanan surat belum dikonfigurasi." }, { status: 503 });
  const envelope = envelopeSchema.safeParse(await request.json());
  if (!envelope.success) return NextResponse.json({ error: "Jenis surat tidak valid." }, { status: 422 });
  const values = requestSchemaFor(envelope.data.type).safeParse(envelope.data.values);
  if (!values.success) return NextResponse.json({ error: values.error.issues[0]?.message ?? "Data surat tidak valid." }, { status: 422 });
  if (values.data.website) return NextResponse.json({ error: "Pengiriman tidak dapat diproses." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const code = unitCode(values.data.gang, values.data.houseNumber);
  const { data: property } = await supabase.from("properties").select("id").eq("unit_code", code).maybeSingle();
  const { data: requestRow, error } = await supabase.from("service_requests").insert({
    request_type: envelope.data.type,
    property_id: property?.id ?? null,
    contact_name: values.data.contactName,
    contact_email: values.data.contactEmail,
    contact_whatsapp: values.data.contactWhatsapp,
    payload: values.data,
  }).select("id").single();
  if (error || !requestRow) return NextResponse.json({ error: "Permohonan surat tidak dapat dikirim." }, { status: 500 });

  const names = { move: "Surat Keterangan Pindah Rumah", domicile: "Surat Keterangan Domisili", single: "Surat Keterangan Belum Menikah" };
  let receiptEmailSent = false;
  try {
    receiptEmailSent = (await sendSafeReceipt({ to: values.data.contactEmail, unitCode: code, reference: requestRow.id, service: names[envelope.data.type] })).sent;
  } catch {
    receiptEmailSent = false;
  }
  return NextResponse.json({ ok: true, reference: requestRow.id, receiptEmailSent });
}
