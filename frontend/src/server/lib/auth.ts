// @ts-nocheck
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../supabase/admin";
import { mapProfile } from "./mapper";
import { getPermissionsForRole } from "./permissions";
import { jsonError } from "./response";

export type AuthUser = ReturnType<typeof mapProfile>;

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = extractToken(request);
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  if (profile.status === "blocked" || profile.status === "suspended") return null;

  return mapProfile(profile);
}

export function extractToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return { user: null, error: jsonError("Unauthorized", 401) };
  return { user, error: null };
}

export async function requireAdmin(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return { user: null, error };
  if (user!.role !== "admin" && user!.role !== "superadmin") {
    return { user: null, error: jsonError("Forbidden", 403) };
  }
  return { user, error: null };
}

export async function requirePermission(request: NextRequest, permission: string) {
  const { user, error } = await requireAdmin(request);
  if (error) return { user: null, error };
  if (user!.role !== "superadmin" && !(user!.permissions || []).includes(permission)) {
    return { user: null, error: jsonError("Forbidden", 403) };
  }
  return { user, error: null };
}

export async function logAudit(
  userId: string | null,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  ip?: string | null,
  userAgent?: string | null
) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      details: details || {},
      ip_address: ip,
      user_agent: userAgent || null,
    });
  } catch {
    // Non-blocking audit logging
  }
}

export function formatAuthResponse(
  session: { access_token: string; refresh_token: string },
  profile: Record<string, unknown>
) {
  const role = profile.role as string;
  const permissions =
    Array.isArray(profile.permissions) && (profile.permissions as string[]).length > 0
      ? (profile.permissions as string[])
      : getPermissionsForRole(role);

  const customer = mapProfile({ ...profile, permissions });

  return {
    token: session.access_token,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    customer,
    user: customer,
  };
}
