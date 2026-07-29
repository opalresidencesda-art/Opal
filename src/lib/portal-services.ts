import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getAllCashTransactions, type CashCategoryTotals } from "@/lib/cash";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

export type CashSummary = {
  sourceStatus: "ready" | "unavailable";
  income: number;
  expense: number;
  balance: number;
  lastUpdated: string | null;
  categories: CashCategoryTotals[];
};

export type StaffProfile = { id?: string; name: string; role: string; whatsapp: string | null; photoPath: string | null };
export type HomeSpec = { id?: string; category: "Keramik" | "Cat" | "Kontak"; label: string; value: string };
export type FloorPlanAsset = { id?: string; title: string; storagePath: string; altText: string };

function client() {
  if (!isSupabaseConfigured() || !supabaseUrl || !supabasePublishableKey) return null;
  return createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false } });
}

export async function getPublicCashSummary(): Promise<CashSummary> {
  const supabase = client();
  if (!supabase) return { sourceStatus: "unavailable", income: 0, expense: 0, balance: 0, lastUpdated: null, categories: [] };
  const { data, error } = await getAllCashTransactions(supabase, { publicOnly: true });
  if (error || !data) return { sourceStatus: "unavailable", income: 0, expense: 0, balance: 0, lastUpdated: null, categories: [] };

  const categoryMap = new Map<string, { income: number; expense: number }>();
  let income = 0;
  let expense = 0;
  for (const item of data) {
    const row = categoryMap.get(item.category) ?? { income: 0, expense: 0 };
    if (item.direction === "income") {
      income += item.amount_rupiah;
      row.income += item.amount_rupiah;
    } else {
      expense += item.amount_rupiah;
      row.expense += item.amount_rupiah;
    }
    categoryMap.set(item.category, row);
  }
  return {
    sourceStatus: "ready",
    income,
    expense,
    balance: income - expense,
    lastUpdated: data[0]?.transaction_date ?? null,
    categories: [...categoryMap.entries()].map(([category, totals]) => ({ category, ...totals })).sort((a, b) => b.income + b.expense - (a.income + a.expense)),
  };
}

export async function getPublishedStaff(): Promise<StaffProfile[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase.from("staff_profiles").select("id,name,role,whatsapp,photo_path").eq("published", true).order("sort_order");
  if (error) return [];
  return (data ?? []).map((item) => ({ id: item.id, name: item.name, role: item.role, whatsapp: item.whatsapp, photoPath: item.photo_path }));
}

export async function getPublishedHomeSpecs(): Promise<HomeSpec[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase.from("home_specs").select("id,category,label,value").eq("published", true).order("sort_order");
  if (error) return [];
  return (data ?? []).map((item) => ({ id: item.id, category: item.category as HomeSpec["category"], label: item.label, value: item.value }));
}

export async function getPublishedFloorPlans(): Promise<FloorPlanAsset[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase.from("floor_plan_assets").select("id,title,storage_path,alt_text").eq("published", true).order("sort_order");
  if (error) return [];
  return (data ?? []).map((item) => ({ id: item.id, title: item.title, storagePath: item.storage_path, altText: item.alt_text }));
}
