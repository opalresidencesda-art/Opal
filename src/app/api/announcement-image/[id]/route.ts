import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
  if (!isSupabaseAdminConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Tidak ditemukan.", { status: 404 });

  const supabase = createSupabaseAdminClient();
  const { data: announcement } = await supabase.from("announcements").select("image_path,image_alt,published").eq("id", id).maybeSingle();
  if (!announcement?.image_path || !/^announcements\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(announcement.image_path)) return new Response("Tidak ditemukan.", { status: 404 });

  const isPublic = announcement.published;
  if (!isPublic && !(await signedInAdmin())) return new Response("Tidak ditemukan.", { status: 404 });

  const { data, error } = await supabase.storage.from("opal-assets").download(announcement.image_path);
  if (error || !data) return new Response("Gambar tidak tersedia.", { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "content-type": data.type || "image/jpeg",
      "cache-control": isPublic ? "public, max-age=3600, stale-while-revalidate=86400" : "private, no-store",
      "content-disposition": `inline; filename="announcement-${id}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
