import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isStaffAssetPath, isUuid } from "@/lib/storage-paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function signedInAdmin() {
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!email) return false;
  const { data } = await createSupabaseAdminClient().from("admin_users").select("email").eq("email", email).maybeSingle();
  return Boolean(data);
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseAdminConfigured() || !isUuid(id)) return new Response("Tidak ditemukan.", { status: 404 });

  const supabase = createSupabaseAdminClient();
  const { data: staff } = await supabase.from("staff_profiles").select("photo_path,published").eq("id", id).maybeSingle();
  if (!isStaffAssetPath(staff?.photo_path)) return new Response("Tidak ditemukan.", { status: 404 });
  if (!staff.published && !(await signedInAdmin())) return new Response("Tidak ditemukan.", { status: 404 });

  const { data, error } = await supabase.storage.from("opal-assets").download(staff.photo_path);
  if (error || !data) return new Response("Foto tidak tersedia.", { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "content-type": data.type || "image/jpeg",
      "cache-control": staff.published ? "public, max-age=3600, stale-while-revalidate=86400" : "private, no-store",
      "content-disposition": `inline; filename="staff-${id}"`,
      "cross-origin-resource-policy": "same-origin",
      "x-content-type-options": "nosniff",
    },
  });
}
