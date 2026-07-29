import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin";
import { getAllCashTransactions } from "@/lib/cash";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function csvValue(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET() {
  const context = await getAdminContext();
  if (context.kind !== "admin") return NextResponse.json({ error: "not authorized" }, { status: 401 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await getAllCashTransactions(supabase);
  if (error || !data) return NextResponse.json({ error: "cash data unavailable" }, { status: 503 });

  const lines = [
    ["Tanggal", "Kategori", "Arah", "Nominal (Rp)", "Keterangan", "Tampil ke warga"].map(csvValue).join(","),
    ...data.map((row) => [row.transaction_date, row.category, row.direction === "income" ? "Pemasukan" : "Pengeluaran", row.amount_rupiah, row.description, row.is_public ? "Ya" : "Tidak"].map(csvValue).join(",")),
  ];
  return new NextResponse(`\uFEFF${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kas-opal-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
