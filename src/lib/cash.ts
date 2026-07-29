import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;

export type CashTransactionData = {
  id?: string;
  transaction_date: string;
  category: string;
  description: string;
  direction: "income" | "expense";
  amount_rupiah: number;
  is_public: boolean;
};

export async function getAllCashTransactions(
  supabase: SupabaseClient,
  options: { publicOnly?: boolean } = {},
) {
  const rows: CashTransactionData[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from("cash_transactions")
      .select("id,transaction_date,category,description,direction,amount_rupiah,is_public")
      .order("transaction_date", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (options.publicOnly) query = query.eq("is_public", true);
    const { data, error } = await query;
    if (error) return { data: null, error };
    rows.push(...((data ?? []) as CashTransactionData[]));
    if ((data ?? []).length < PAGE_SIZE) break;
  }
  return { data: rows, error: null };
}
