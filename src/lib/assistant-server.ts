import "server-only";

import { getAdminContext } from "@/lib/admin";
import { getPortalData } from "@/lib/data";
import { buildPublicAssistantDocuments, getAssistantSearchQuestion, isCashQuestion, isRestrictedQuestion, summarizeCashTransactions, type AssistantDocument, type AssistantMessage, type AssistantScope, type PublicCashSummaryForAssistant } from "@/lib/assistant";
import { getAllCashTransactions } from "@/lib/cash";
import { getPublicCashSummary, getPublicCashTransactions } from "@/lib/portal-services";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AssistantKnowledge = {
  scope: AssistantScope;
  email: string | null;
  documents: AssistantDocument[];
  adminDataUnavailable: boolean;
};

function lastUserMessage(messages: AssistantMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

function extractUnitCode(question: string) {
  const match = question.match(/\bOP\s*([1235])\s*[-–]\s*([0-9]{1,3})\b/i);
  return match ? `OP ${match[1]} - ${match[2]}` : null;
}

function isPropertyQuestion(question: string) {
  return Boolean(extractUnitCode(question)) || /\b(rumah|warga|penghuni|keluarga|alamat|whatsapp|kepala keluarga|properti|surat)\b/i.test(question);
}

function propertyDocument(row: {
  unit_code: string;
  occupancy_status: string | null;
  resident_profiles?: Array<Record<string, unknown>> | Record<string, unknown> | null;
  property_contributions?: Array<Record<string, unknown>> | null;
  service_requests?: Array<Record<string, unknown>> | null;
}): AssistantDocument {
  const profile = Array.isArray(row.resident_profiles) ? row.resident_profiles[0] : row.resident_profiles;
  const contributions = row.property_contributions ?? [];
  const requests = row.service_requests ?? [];
  const profileText = profile ? `Penanggung jawab: ${String(profile.responsible_name ?? "belum tersedia")}. Alamat: ${String(profile.responsible_address ?? "belum tersedia")}. WhatsApp: ${String(profile.whatsapp ?? "belum tersedia")}. Kepala keluarga: ${String(profile.head_of_household_name ?? "belum tersedia")}. Pekerjaan: ${String(profile.head_of_household_occupation ?? "belum tersedia")}. Jumlah penghuni: ${String(profile.occupants_count ?? "belum tersedia")}. Email: ${String(profile.contact_email ?? "belum tersedia")}.` : "Profil warga belum tersedia.";
  const contributionText = contributions.length ? `Catatan iuran: ${contributions.slice(0, 12).map((item) => `${String(item.period ?? "tanpa periode")} ${String(item.category)} ${String(item.status)} ${String(item.amount_rupiah)} rupiah`).join("; ")}.` : "Belum ada catatan iuran.";
  const requestText = requests.length ? `Pengajuan layanan: ${requests.slice(0, 12).map((item) => { const issuance = Array.isArray(item.document_issuances) ? item.document_issuances[0] : item.document_issuances; return `${String(item.request_type)} ${String(item.status)} ${String(item.created_at)}${issuance ? ` nomor ${String((issuance as Record<string, unknown>).document_number ?? "belum diterbitkan")} terbit ${String((issuance as Record<string, unknown>).issued_at ?? "")}` : ""}`; }).join("; ")}.` : "Belum ada pengajuan layanan.";
  return { title: `Data rumah ${row.unit_code}`, text: `Unit: ${row.unit_code}. Status hunian: ${row.occupancy_status ?? "belum tersedia"}. ${profileText} ${contributionText} ${requestText}`, source: { label: `Panel admin · ${row.unit_code}`, href: "/admin" } };
}

async function loadAdminDocuments(question: string, searchQuestion = question): Promise<{ documents: AssistantDocument[]; unavailable: boolean }> {
  const supabase = await createSupabaseServerClient();
  const documents: AssistantDocument[] = [];
  let unavailable = false;

  if (isCashQuestion(searchQuestion)) {
    const { data, error } = await getAllCashTransactions(supabase);
    if (error || !data) unavailable = true;
    else documents.push(summarizeCashTransactions(data, question, { label: "Panel admin · Kas OPAL", href: "/admin/kas" }));
  }

  if (isPropertyQuestion(searchQuestion) && !isRestrictedQuestion(question)) {
    const unitCode = extractUnitCode(searchQuestion);
    let query = supabase.from("properties").select("unit_code,occupancy_status,resident_profiles(responsible_name,responsible_address,whatsapp,head_of_household_name,head_of_household_occupation,occupants_count,contact_email),property_contributions(category,period,amount_rupiah,paid_at,status),service_requests(request_type,status,created_at,document_issuances(document_number,issued_at))").eq("active", true).limit(unitCode ? 1 : 100);
    if (unitCode) query = query.eq("unit_code", unitCode);
    const { data, error } = await query;
    if (error) unavailable = true;
    else if (unitCode) for (const row of data ?? []) documents.push(propertyDocument(row));
    else {
      const rows = (data ?? []) as Array<{ unit_code: string; occupancy_status: string | null }>;
      const statuses = new Map<string, number>();
      for (const row of rows) statuses.set(row.occupancy_status ?? "belum diisi", (statuses.get(row.occupancy_status ?? "belum diisi") ?? 0) + 1);
      documents.push({ title: "Ringkasan rumah OPAL", text: `Jumlah rumah aktif terambil: ${rows.length}. Status hunian: ${[...statuses.entries()].map(([status, count]) => `${status} ${count}`).join(", ") || "belum tersedia"}. Untuk detail profil, sebutkan kode unit seperti OP 1 - 1.`, source: { label: "Panel admin · Direktori rumah", href: "/admin" } });
    }
  }
  return { documents, unavailable };
}

export async function loadAssistantKnowledge(messages: AssistantMessage[]): Promise<AssistantKnowledge> {
  const question = lastUserMessage(messages);
  const searchQuestion = getAssistantSearchQuestion(messages) || question;
  const [portal, publicCash, adminContext] = await Promise.all([getPortalData(), getPublicCashSummary(), getAdminContext()]);
  const documents = buildPublicAssistantDocuments(portal, publicCash as PublicCashSummaryForAssistant);
  if (adminContext.kind !== "admin") {
    if (isCashQuestion(searchQuestion)) {
      const publicTransactions = await getPublicCashTransactions();
      if (publicTransactions.error || !publicTransactions.data) return { scope: "public", email: null, documents, adminDataUnavailable: true };
      documents.push(summarizeCashTransactions(publicTransactions.data, question, { label: "Kas OPAL publik", href: "/kas" }));
    }
    return { scope: "public", email: null, documents, adminDataUnavailable: false };
  }
  if (isRestrictedQuestion(question)) return { scope: "admin", email: adminContext.email, documents, adminDataUnavailable: false };
  const admin = await loadAdminDocuments(question, searchQuestion);
  return { scope: "admin", email: adminContext.email, documents: [...documents, ...admin.documents], adminDataUnavailable: admin.unavailable };
}

export function getLastUserMessage(messages: AssistantMessage[]) {
  return lastUserMessage(messages);
}
