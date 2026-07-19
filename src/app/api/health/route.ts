import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function GET() {
  return NextResponse.json({ status: "ok", supabase: isSupabaseConfigured() ? "configured" : "not-configured" });
}
