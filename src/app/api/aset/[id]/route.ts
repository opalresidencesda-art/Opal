import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseAdminConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Tidak ditemukan.", { status: 404 });
  const supabase = createSupabaseAdminClient();
  const { data: asset } = await supabase.from("floor_plan_assets").select("storage_path,alt_text").eq("id", id).eq("published", true).maybeSingle();
  if (!asset) return new Response("Tidak ditemukan.", { status: 404 });
  const { data, error } = await supabase.storage.from("opal-assets").download(asset.storage_path);
  if (error || !data) return new Response("Aset tidak tersedia.", { status: 404 });
  return new Response(await data.arrayBuffer(), { headers: { "content-type": data.type || "image/jpeg", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
}
