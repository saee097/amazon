import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";
import { toMongoIds } from "@/server/lib/mapper";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    
    const mapped = toMongoIds(data || []);
    
    return NextResponse.json({
      rawCount: Array.isArray(data) ? data.length : 0,
      mappedCount: mapped.length,
      rawData: data,
      mappedData: mapped,
      error: error ? error.message : null,
    });
  } catch (e) {
    return NextResponse.json({
      error: "Exception",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
