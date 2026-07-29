import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isFloorPlanAssetPath, isUuid } from "@/lib/storage-paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseAdminConfigured() || !isUuid(id)) return new Response("Tidak ditemukan.", { status: 404 });
  const supabase = createSupabaseAdminClient();
  const { data: asset } = await supabase.from("floor_plan_assets").select("storage_path").eq("id", id).eq("published", true).maybeSingle();
  if (!isFloorPlanAssetPath(asset?.storage_path)) return new Response("Tidak ditemukan.", { status: 404 });
  const { data, error } = await supabase.storage.from("opal-assets").download(asset.storage_path);
  if (error || !data) return new Response("Aset tidak tersedia.", { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "content-type": data.type || "image/jpeg",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      "content-disposition": `inline; filename="floor-plan-${id}"`,
      "cross-origin-resource-policy": "same-origin",
      "x-content-type-options": "nosniff",
    },
  });
}
