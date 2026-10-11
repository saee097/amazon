// @ts-nocheck
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/admin";
import {
  extractToken,
  formatAuthResponse,
  getAuthUser,
  logAudit,
  requireAuth,
} from "../../lib/auth";
import { mapProfile } from "../../lib/mapper";
import { jsonError, jsonOk, jsonRaw } from "../../lib/response";
import { loginSchema, registerSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyCodeSchema, resetByCodeSchema } from "../../lib/validation";
import { sendVerificationCode } from "../../lib/email";
import { validateJson } from "../../lib/validate";

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

const resetCodes = new Map<string, { email: string; code: string; expiresAt: number; verified?: boolean }>();

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return false;
  }
  return true;
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.ip || "unknown";
}

export async function handleAuth(
  method: string,
  path: string[],
  request: NextRequest
) {
  const supabase = getSupabaseAdmin();
  const action = path[1];

  // POST /auth/login
  if (method === "POST" && action === "login") {
    const ip = getClientIp(request);
    if (!checkRateLimit(`login:${ip}`)) {
      return jsonError("Too many sign-in attempts. Please wait a few minutes before trying again.", 429);
    }

    const { data: body, error: validationError } = await validateJson(request, loginSchema);
    if (validationError) return validationError;

    const { email, password } = body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("rate limit") || lower.includes("too many")) {
        return jsonError(
          "Too many sign-in attempts. Supabase temporarily blocked this IP. Please wait a few minutes before trying again.",
          429
        );
      }
      if (lower.includes("email not confirmed")) {
        return jsonError("Please verify your email before signing in.", 403);
      }
      if (lower.includes("invalid") || lower.includes("credentials")) {
        return jsonError("Invalid email or password", 401);
      }
      return jsonError(error.message, 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (!profile) return jsonError("Profile not found", 404);
    if (profile.status === "blocked" || profile.status === "suspended") {
      return jsonError("Account is locked or suspended", 403);
    }

    const loginIp = request.headers.get("x-forwarded-for");
    const loginUa = request.headers.get("user-agent") || null;
    await logAudit(
      profile.id,
      "login",
      "auth",
      profile.id,
      { user_agent: loginUa },
      loginIp,
      loginUa
    );
    await supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", profile.id);

    return jsonRaw(formatAuthResponse(data.session, profile));
  }

  // POST /auth/register
  if (method === "POST" && action === "register") {
    const ip = getClientIp(request);
    if (!checkRateLimit(`register:${ip}`)) {
      return jsonError("Too many registration attempts. Please wait a few minutes.", 429);
    }

    const { data: body, error: validationError } = await validateJson(request, registerSchema);
    if (validationError) return validationError;

    const { email, password, firstName, lastName, username, phone, role, inviteCode } = body;

    // Role gating: customer is open, admin/superadmin require invite codes.
    // Invite codes MUST be provided via environment variables — there are no
    // insecure default values. If a privileged role is requested and the
    // corresponding env var is missing, registration is refused.
    const ADMIN_INVITE = process.env.ADMIN_INVITE_CODE;
    const SUPER_INVITE = process.env.SUPERADMIN_INVITE_CODE;
    const requestedRole = (role || "customer").toString().toLowerCase();
    let assignedRole: "customer" | "admin" | "superadmin" = "customer";
    if (requestedRole === "superadmin") {
      if (!SUPER_INVITE) {
        return jsonError("Super-admin registration is not configured on this server", 403);
      }
      if (!inviteCode || inviteCode !== SUPER_INVITE) {
        return jsonError("Invalid super-admin invite code", 403);
      }
      assignedRole = "superadmin";
    } else if (requestedRole === "admin") {
      if (!ADMIN_INVITE) {
        return jsonError("Admin registration is not configured on this server", 403);
      }
      if (!inviteCode || inviteCode !== ADMIN_INVITE) {
        return jsonError("Invalid admin invite code", 403);
      }
      assignedRole = "admin";
    } else if (requestedRole && requestedRole !== "customer") {
      return jsonError("Invalid role", 400);
    }

    // Uniqueness check
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (existing) return jsonError("An account with this email already exists.", 409);

    // Use admin.createUser so email is auto-confirmed — no verification email needed
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,       // ← skip email verification
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        username: username || email.split("@")[0],
        phone: phone || "",
        role: assignedRole,
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes("already")) {
        return jsonError("An account with this email already exists.", 409);
      }
      return jsonError(error.message, 400);
    }

    // Upsert profile with the assigned role (trigger creates the row first).
    // If the profile write fails, remove the just-created auth user so we
    // don't leave an orphaned auth record with no usable profile.
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          username: username || email.split("@")[0],
          phone: phone || null,
          role: assignedRole,
          email_verified: true,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
        return jsonError("Failed to complete registration. Please try again.", 500);
      }
    }

    return jsonOk(
      {
        message: "Registration successful. You can now sign in.",
        user: {
          id: authData?.user?.id,
          email,
          firstName,
          lastName,
          username: username || email.split("@")[0],
          role: assignedRole,
        },
      },
      201
    );
  }

  // POST /auth/refresh
  if (method === "POST" && action === "refresh") {
    const body = await request.json();
    const refreshToken = body.refreshToken || body.refresh_token;
    if (!refreshToken) return jsonError("Refresh token required", 400);

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return jsonError("Invalid refresh token", 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user!.id)
      .single();

    if (!profile) return jsonError("Profile not found", 404);

    return jsonRaw({
      token: data.session.access_token,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  }

  // GET /auth/verify
  if (method === "GET" && action === "verify") {
    const user = await getAuthUser(request);
    if (!user) return jsonError("Unauthorized", 401);
    return jsonRaw({
      success: true,
      user,
      ip: getClientIp(request),
    });
  }

  // GET /auth/sessions — recent login/logout events for the current user
  if (method === "GET" && action === "sessions") {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    const { data } = await supabase
      .from("audit_logs")
      .select("action, ip_address, user_agent, created_at")
      .eq("user_id", user!._id)
      .in("action", ["login", "logout"])
      .order("created_at", { ascending: false })
      .limit(20);
    return jsonOk(
      (data || []).map((l) => ({
        id: l.id,
        action: l.action,
        ip: l.ip_address,
        userAgent: l.user_agent,
        createdAt: l.created_at,
      }))
    );
  }

  // GET /auth/profile
  if (method === "GET" && action === "profile") {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    return jsonOk(user);
  }

  // PUT /auth/profile — update own profile fields and preferences
  if (method === "PUT" && action === "profile") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.firstName !== undefined) updates.first_name = body.firstName;
    if (body.lastName !== undefined) updates.last_name = body.lastName;
    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.username !== undefined) updates.username = body.username;

    const notificationPrefs = body.notificationPrefs ?? body.notification_prefs;
    if (notificationPrefs !== undefined) updates.notification_prefs = notificationPrefs;
    const privacyPrefs = body.privacyPrefs ?? body.privacy_prefs;
    if (privacyPrefs !== undefined) updates.privacy_prefs = privacyPrefs;

    // Email is intentionally not mutable through this endpoint to prevent
    // account-takeover via a stale session; changing it requires a verified flow.
    if (body.email !== undefined) delete updates.email;

    if (Object.keys(updates).length === 0) {
      return jsonError("No updatable fields provided", 400);
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user!._id)
      .select()
      .single();

    if (updateError) return jsonError(updateError.message, 400);

    const audit: Record<string, unknown> = {
      fields: Object.keys(updates),
    };
    await logAudit(
      user!._id,
      "update_profile",
      "profiles",
      user!._id,
      audit,
      getClientIp(request),
      request.headers.get("user-agent") || null
    );

    return jsonOk(mapProfile(profile));
  }

  // PUT /auth/change-password
  if (method === "PUT" && action === "change-password") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { data: body, error: validationError } = await validateJson(request, changePasswordSchema);
    if (validationError) return validationError;

    const { currentPassword, newPassword } = body;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email,
      password: currentPassword,
    });
    if (signInError) return jsonError("Current password is incorrect", 400);

    const { error: updateError } = await supabase.auth.admin.updateUserById(user!._id, {
      password: newPassword,
    });
    if (updateError) return jsonError(updateError.message, 400);

    await logAudit(
      user!._id,
      "change_password",
      "auth",
      user!._id,
      {},
      getClientIp(request),
      request.headers.get("user-agent") || null
    );

    return jsonOk({ message: "Password updated successfully" });
  }

  // POST /auth/delete-account
  if (method === "POST" && action === "delete-account") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    await supabase.from("profiles").update({ status: "inactive" }).eq("id", user!._id);
    await supabase.auth.admin.deleteUser(user!._id);

    return jsonOk({ message: "Account deleted" });
  }

  // POST /auth/forgot-password
  if (method === "POST" && action === "forgot-password") {
    const ip = getClientIp(request);
    if (!checkRateLimit(`forgot:${ip}`)) {
      return jsonError("Too many requests. Please wait a few minutes.", 429);
    }

    const { data: body, error: validationError } = await validateJson(request, forgotPasswordSchema);
    if (validationError) return validationError;

    const { email } = body;

    const code = generateCode();
    resetCodes.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    try {
      await sendVerificationCode(email, code);
    } catch {
      // In dev mode without email service, still succeed
    }

    // NOTE: resetCodes and the rate-limit `attempts` map are kept in-memory.
    // In a serverless (Vercel) deployment these are per-instance and do not
    // survive cold starts or share across instances. For multi-instance
    // production, back them with a database table (e.g. password_reset_codes
    // with TTL) and a rate-limit store. The reset code is NEVER returned to
    // the client.
    return jsonRaw({
      success: true,
      message: "Verification code sent",
    });
  }

  // POST /auth/verify-code
  if (method === "POST" && action === "verify-code") {
    const { data: body, error: validationError } = await validateJson(request, verifyCodeSchema);
    if (validationError) return validationError;

    const { email, code } = body;
    const emailKey = email.toLowerCase();

    const stored = resetCodes.get(emailKey);
    if (!stored) {
      return jsonError("Invalid or expired code. Please request a new one.", 400);
    }
    if (stored.code !== code) {
      return jsonError("Invalid code. Please try again.", 400);
    }
    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(emailKey);
      return jsonError("Code has expired. Please request a new one.", 400);
    }

    resetCodes.set(emailKey, { ...stored, verified: true });

    return jsonOk({ message: "Code verified. You may now reset your password." });
  }

  // POST /auth/reset-password/:token (token-based, legacy)
  if (method === "POST" && action === "reset-password" && path[2]) {
    const { data: body, error: validationError } = await validateJson(request, resetPasswordSchema);
    if (validationError) return validationError;

    const { password } = body;

    const token = path[2];
    const { data, error } = await supabase.auth.exchangeCodeForSession(token).catch(() => ({
      data: null,
      error: { message: "Invalid token" },
    }));

    if (error || !data?.user) {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) return jsonError("Invalid or expired reset token", 400);
    } else {
      await supabase.auth.admin.updateUserById(data.user.id, { password });
    }

    return jsonOk({ message: "Password reset successful" });
  }

  // POST /auth/reset-password (code-based)
  if (method === "POST" && action === "reset-password" && !path[2]) {
    const { data: body, error: validationError } = await validateJson(request, resetByCodeSchema);
    if (validationError) return validationError;

    const { email, code, password, confirmPassword } = body;

    if (password !== confirmPassword) {
      return jsonError("Passwords do not match", 400);
    }

    const emailKey = email.toLowerCase();
    const stored = resetCodes.get(emailKey);
    if (!stored) {
      return jsonError("Invalid or expired code. Please request a new one.", 400);
    }
    if (!stored.verified) {
      return jsonError("Please verify your code first.", 400);
    }
    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(emailKey);
      return jsonError("Code has expired. Please request a new one.", 400);
    }

    resetCodes.delete(emailKey);

    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", emailKey)
      .single();

    if (userError || !userData) {
      return jsonError("User not found", 404);
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userData.id, {
      password,
    });
    if (updateError) return jsonError(updateError.message, 400);

    return jsonOk({ message: "Password reset successful" });
  }

  // GET /auth/verify-email/:token
  if (method === "GET" && action === "verify-email" && path[2]) {
    const token = extractToken(request) || path[2];
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });
      if (error) return jsonError("Invalid verification token", 400);
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ email_verified: true })
          .eq("id", data.user.id);
      }
      return jsonOk({ message: "Email verified successfully" });
    } catch {
      return jsonOk({ message: "Email verification processed" });
    }
  }

  return jsonError("Not found", 404);
}
