import { requireAdmin } from "@/lib/admin";
import { parsePropertyImageRecord, propertyImageSourceName, type PropertyImageRecord } from "@/lib/property-image-records";
import { isUuid } from "@/lib/storage-paths";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) return new Response("Tidak ditemukan.", { status: 404 });

  const supabase = createSupabaseAdminClient();
  const { data: record } = await supabase.from("source_imports").select("id,source_name,notes,imported_at").eq("source_name", propertyImageSourceName(id)).order("imported_at", { ascending: false }).limit(1).maybeSingle();
  const image = record ? parsePropertyImageRecord(record as PropertyImageRecord) : null;
  if (!image) return new Response("Tidak ditemukan.", { status: 404 });

  const { data, error } = await supabase.storage.from("opal-assets").download(image.storagePath);
  if (error || !data) return new Response("Gambar tidak tersedia.", { status: 404 });

  const extension = image.storagePath.split(".").at(-1)?.toLowerCase();
  const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
  return new Response(await data.arrayBuffer(), {
    headers: {
      "content-type": contentType,
      "content-disposition": `inline; filename="property-${id}.${extension}"`,
      "cache-control": "private, no-store",
      "cross-origin-resource-policy": "same-origin",
      "x-content-type-options": "nosniff",
    },
  });
}
