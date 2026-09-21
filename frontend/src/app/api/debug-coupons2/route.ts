// @ts-nocheck
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    
    return Response.json({ 
      success: true, 
      data,
      error: error ? { message: error.message, code: error.code } : null,
      count: data?.length || 0
    });
  } catch (e) {
    return Response.json({ error: e.message, stack: e.stack });
  }
}
