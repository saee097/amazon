import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return NextResponse.json({
      status: "ok",
      database: error ? "unhealthy" : "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ status: "error", database: "unhealthy" }, { status: 503 });
  }
}
