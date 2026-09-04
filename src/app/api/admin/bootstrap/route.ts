import { timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maintenanceEmailPattern = /^opalresidence\.sda\+maintenance-[0-9a-f]{12}@gmail\.com$/;

function authorized(request: Request) {
  const configured = process.env.OPAL_ADMIN_BOOTSTRAP_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!configured || configured.length < 32 || supplied.length !== configured.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(configured));
}

async function input(request: Request) {
  const value = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof value?.email === "string" ? value.email.trim().toLowerCase() : "";
  const password = typeof value?.password === "string" ? value.password : "";
  if (!maintenanceEmailPattern.test(email) || password.length < 32 || password.length > 128) return null;
  return { email, password };
}

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  if (!authorized(request)) return response({ ok: false }, 404);
  const values = await input(request);
  if (!values) return response({ ok: false, reason: "invalid_input" }, 400);

  const supabase = createSupabaseAdminClient();
  const created = await supabase.auth.admin.createUser({ email: values.email, password: values.password, email_confirm: true });
  if (created.error || !created.data.user) return response({ ok: false, reason: "create_failed" }, 409);
  const admin = await supabase.from("admin_users").insert({ email: values.email });
  if (admin.error) {
    await supabase.auth.admin.deleteUser(created.data.user.id);
    return response({ ok: false, reason: "grant_failed" }, 409);
  }
  return response({ ok: true });
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return response({ ok: false }, 404);
  const values = await input(request);
  if (!values) return response({ ok: false, reason: "invalid_input" }, 400);

  const supabase = createSupabaseAdminClient();
  const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = users.data.users.find((item) => item.email?.toLowerCase() === values.email);
  const revoked = await supabase.from("admin_users").delete().eq("email", values.email);
  if (revoked.error) return response({ ok: false, reason: "revoke_failed" }, 409);
  if (user) {
    const deleted = await supabase.auth.admin.deleteUser(user.id);
    if (deleted.error) return response({ ok: false, reason: "delete_failed" }, 409);
  }
  return response({ ok: true });
}
