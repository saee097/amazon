import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../supabase/admin";
import {
  extractToken,
  formatAuthResponse,
  getAuthUser,
  logAudit,
  requireAuth,
} from "../../lib/auth";
import { mapProfile } from "../../lib/mapper";
import { jsonError, jsonOk, jsonRaw } from "../../lib/response";

export async function handleAuth(
  method: string,
  path: string[],
  request: NextRequest
) {
  const supabase = getSupabaseAdmin();
  const action = path[1];

  // POST /auth/login
  if (method === "POST" && action === "login") {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonError("Email and password are required", 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("rate limit") || lower.includes("too many")) {
        return jsonError(
          "Too many sign-in attempts. Please wait a few minutes before trying again.",
          429
        );
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

    await logAudit(profile.id, "login", "auth", profile.id, {}, request.headers.get("x-forwarded-for"));

    return jsonRaw(formatAuthResponse(data.session, profile));
  }

  // POST /auth/register
  if (method === "POST" && action === "register") {
    const body = await request.json();
    const { email, password, firstName, lastName, username, phone } = body;

    if (!email || !password || !firstName || !lastName) {
      return jsonError("Required fields missing", 400);
    }

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
      },
    });

    if (error) {
      // If user already exists surface a friendly message
      if (error.message?.toLowerCase().includes("already")) {
        return jsonError("An account with this email already exists.", 409);
      }
      return jsonError(error.message, 400);
    }

    // Update profile with role and all fields (trigger may have already created it)
    if (authData.user) {
      await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          username: username || email.split("@")[0],
          phone: phone || null,
          role: "customer",
          email_verified: true,
        })
        .eq("id", authData.user.id);
    }

    return jsonOk({ message: "Registration successful. You can now sign in." }, 201);
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
    return jsonRaw({ success: true, user });
  }

  // GET /auth/profile
  if (method === "GET" && action === "profile") {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    return jsonOk(user);
  }

  // PUT /auth/profile
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

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user!._id)
      .select()
      .single();

    if (updateError) return jsonError(updateError.message, 400);
    return jsonOk(mapProfile(profile));
  }

  // PUT /auth/change-password
  if (method === "PUT" && action === "change-password") {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return jsonError("Current and new password are required", 400);
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email,
      password: currentPassword,
    });
    if (signInError) return jsonError("Current password is incorrect", 400);

    const { error: updateError } = await supabase.auth.admin.updateUserById(user!._id, {
      password: newPassword,
    });
    if (updateError) return jsonError(updateError.message, 400);

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
    const body = await request.json();
    const { email } = body;
    if (!email) return jsonError("Email is required", 400);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    });

    return jsonRaw({ success: true, message: "Password reset email sent if account exists" });
  }

  // POST /auth/reset-password/:token
  if (method === "POST" && action === "reset-password" && path[2]) {
    const body = await request.json();
    const { password } = body;
    if (!password) return jsonError("Password is required", 400);

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
