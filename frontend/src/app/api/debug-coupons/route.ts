// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "none";

  try {
    const supabase = getSupabaseAdmin();

    // Test coupons query
    const { data: coupons, error: couponError } = await supabase
      .from("coupons")
      .select("*");

    // Test profiles query (comparison)
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .limit(3);

    // Get the current JWT role
    const { data: roleData, error: roleError } = await supabase
      .from("profiles")
      .select("id")
      .limit(0);

    return NextResponse.json({
      auth: auth.slice(0, 30) + "...",
      coupons: {
        count: coupons?.length || 0,
        error: couponError?.message,
        data: coupons?.slice(0, 2).map(c => c.code),
      },
      profiles: {
        count: profiles?.length || 0,
        error: profileError?.message,
        data: profiles?.map(p => p.email),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
