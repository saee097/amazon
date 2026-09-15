import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("profiles").select("id").limit(1);
    return NextResponse.json({
      status: "ok",
      database: error ? "unhealthy" : "healthy",
      profileCount: Array.isArray(data) ? data.length : 0,
      error: error ? error.message : null,
      timestamp: new Date().toISOString(),
    });
  } catch (catchErr) {
    return NextResponse.json({ status: "error", database: "unhealthy", error: catchErr.message }, { status: 503 });
  }
}
