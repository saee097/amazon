import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "unhealthy", database: "unhealthy", timestamp: new Date().toISOString() },
        { status: 503, headers }
      );
    }

    return NextResponse.json(
      { status: "ok", database: "healthy", timestamp: new Date().toISOString() },
      { headers }
    );
  } catch {
    return NextResponse.json(
      { status: "unhealthy", database: "unhealthy", timestamp: new Date().toISOString() },
      { status: 503, headers }
    );
  }
}
