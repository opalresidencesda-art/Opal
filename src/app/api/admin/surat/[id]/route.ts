import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Tidak ditemukan.", { status: 404 });
  const supabase = createSupabaseAdminClient();
  const { data: issuance } = await supabase.from("document_issuances").select("storage_path,document_number").eq("id", id).maybeSingle();
  if (!issuance) return new Response("Tidak ditemukan.", { status: 404 });
  const { data, error } = await supabase.storage.from("document-exports").download(issuance.storage_path);
  if (error || !data) return new Response("Dokumen tidak tersedia.", { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${issuance.document_number.replace(/[^A-Za-z0-9._-]/g, "-")}.pdf"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
