import { getPrivateDocument } from "@/lib/private-portal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ token: string; requestId: string }> }) {
  const { token, requestId } = await params;
  const document = await getPrivateDocument(token, requestId);
  if (!document) return new Response("Tidak ditemukan.", { status: 404 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from("document-exports").download(document.storage_path);
  if (error || !data) return new Response("Dokumen tidak tersedia.", { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${document.document_number.replace(/[^A-Za-z0-9._-]/g, "-")}.pdf"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
