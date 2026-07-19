import { redirect } from "next/navigation";
import { isAllowedAdminEmail, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminContext =
  | { kind: "setup" }
  | { kind: "signed-out" }
  | { kind: "forbidden"; email: string }
  | { kind: "admin"; email: string };

export async function getAdminContext(): Promise<AdminContext> {
  if (!isSupabaseConfigured()) return { kind: "setup" };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!email) return { kind: "signed-out" };
  if (!isAllowedAdminEmail(email)) return { kind: "forbidden", email };
  return { kind: "admin", email };
}

export async function requireAdmin() {
  const context = await getAdminContext();
  if (context.kind === "admin") return { supabase: await createSupabaseServerClient(), email: context.email };
  redirect(context.kind === "forbidden" ? "/admin/login?reason=forbidden" : "/admin/login");
}
