import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Tidak ditemukan.", { status: 404 });
  const supabase = createSupabaseAdminClient();
  const { data: evidence } = await supabase.from("resident_evidence").select("storage_path").eq("id", id).maybeSingle();
  if (!evidence) return new Response("Tidak ditemukan.", { status: 404 });
  const { data, error } = await supabase.storage.from("resident-evidence").createSignedUrl(evidence.storage_path, 60);
  if (error || !data) return new Response("Berkas tidak tersedia.", { status: 404 });
  redirect(data.signedUrl);
}
