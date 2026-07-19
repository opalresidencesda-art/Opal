import "server-only";

import { hashAccessToken, isSafeAccessToken } from "@/lib/security";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export type HousePortal = {
  property: { id: string; unitCode: string; occupancyStatus: string | null };
  contributions: Array<{ id: string; category: string; period: string | null; amount: number; paidAt: string | null; status: string }>;
  documents: Array<{ id: string; type: "move" | "domicile" | "single"; status: string; createdAt: string; documentNumber: string | null; issuedAt: string | null }>;
};

export async function getHousePortal(token: string): Promise<HousePortal | null> {
  if (!isSupabaseAdminConfigured() || !isSafeAccessToken(token)) return null;
  const supabase = createSupabaseAdminClient();
  const { data: property } = await supabase
    .from("properties")
    .select("id,unit_code,occupancy_status")
    .eq("access_token_hash", hashAccessToken(token))
    .is("access_token_revoked_at", null)
    .eq("active", true)
    .maybeSingle();
  if (!property) return null;

  const [{ data: contributions }, { data: requests }] = await Promise.all([
    supabase.from("property_contributions").select("id,category,period,amount_rupiah,paid_at,status").eq("property_id", property.id).order("period", { ascending: false }),
    supabase.from("service_requests").select("id,request_type,status,created_at").eq("property_id", property.id).order("created_at", { ascending: false }),
  ]);
  const requestIds = (requests ?? []).map((item) => item.id);
  const { data: issuances } = requestIds.length ? await supabase.from("document_issuances").select("id,request_id,document_number,issued_at").in("request_id", requestIds) : { data: [] };
  const issuanceByRequest = new Map((issuances ?? []).map((item) => [item.request_id, item]));
  return {
    property: { id: property.id, unitCode: property.unit_code, occupancyStatus: property.occupancy_status },
    contributions: (contributions ?? []).map((item) => ({ id: item.id, category: item.category, period: item.period, amount: item.amount_rupiah, paidAt: item.paid_at, status: item.status })),
    documents: (requests ?? []).map((item) => {
      const issuance = issuanceByRequest.get(item.id);
      return { id: item.id, type: item.request_type, status: item.status, createdAt: item.created_at, documentNumber: issuance?.document_number ?? null, issuedAt: issuance?.issued_at ?? null };
    }),
  };
}

export async function getPrivateDocument(token: string, requestId: string) {
  const house = await getHousePortal(token);
  if (!house || !/^[0-9a-f-]{36}$/i.test(requestId)) return null;
  const document = house.documents.find((item) => item.id === requestId && item.documentNumber);
  if (!document) return null;
  const supabase = createSupabaseAdminClient();
  const { data: issuance } = await supabase.from("document_issuances").select("storage_path,document_number").eq("request_id", requestId).maybeSingle();
  return issuance ?? null;
}
