"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ROLES } from "@/lib/rbac";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiBell,
  FiShield,
  FiSave,
  FiCamera,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiLogOut,
  FiClock,
  FiGlobe,
  FiX,
} from "react-icons/fi";
import { AdminPageSkeleton, SkeletonList } from "@/components/ui/skeleton";

const NOTIFICATION_OPTIONS = [
  { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
  { key: "push", label: "Push Notifications", desc: "Receive push notifications in your browser" },
  { key: "order_updates", label: "Order Updates", desc: "Get notified about order status changes" },
  { key: "security_alerts", label: "Security Alerts", desc: "Get notified about security events" },
];

const PRIVACY_OPTIONS = [
  { key: "profile_visible", label: "Profile Visibility", desc: "Make your profile visible to other admins" },
  { key: "activity_visible", label: "Activity Status", desc: "Show when you are active" },
  { key: "show_email", label: "Show Email Address", desc: "Allow other admins to see your email" },
];

function getDeviceLabel(ua) {
  if (!ua) return "Unknown device";
  if (/mobile/i.test(ua) && !/iPad/i.test(ua)) return /iPhone/i.test(ua) ? "iPhone" : "Android device";
  if (/iPad/i.test(ua)) return "iPad";
  return "Desktop";
}

function getBrowserLabel(ua) {
  if (!ua) return "Unknown browser";
  if (/Edg/i.test(ua)) return "Microsoft Edge";
  if (/Chrome|OPR|Opera/i.test(ua)) return "Google Chrome";
  if (/Firefox/i.test(ua)) return "Mozilla Firefox";
  if (/Safari/i.test(ua)) return "Safari";
  return "Unknown browser";
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function initialPrefs(options) {
  const prefs = {};
  options.forEach((o) => (prefs[o.key] = true));
  return prefs;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [notificationPrefs, setNotificationPrefs] = useState(() => initialPrefs(NOTIFICATION_OPTIONS));
  const [privacyPrefs, setPrivacyPrefs] = useState(() => initialPrefs(PRIVACY_OPTIONS));
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [currentIp, setCurrentIp] = useState("");
  const [message, setMessage] = useState(null);

  const messageTimer = useRef(null);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 6000);
  }, []);

  const dismissMessage = () => {
    setMessage(null);
    if (messageTimer.current) clearTimeout(messageTimer.current);
  };

  useEffect(() => {
    const cached = getUser();
    if (!cached) {
      router.replace("/auth/login");
      return;
    }
    if (cached.role !== ROLES.ADMIN && cached.role !== ROLES.SUPERADMIN) {
      showMessage("error", "You do not have permission to view this page.");
      return;
    }

    loadProfile();
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      const { data } = await api.get("/auth/profile");
      const profileData = data.data || data.user || data.customer;
      if (!profileData) throw new Error("Profile not found");
      setAdmin(profileData);
      setForm({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
      });
      setNotificationPrefs((prev) => ({ ...initialPrefs(NOTIFICATION_OPTIONS), ...(profileData.notification_prefs || {}) }));
      setPrivacyPrefs((prev) => ({ ...initialPrefs(PRIVACY_OPTIONS), ...(profileData.privacy_prefs || {}) }));
    } catch (err) {
      const cached = getUser();
      if (!cached) router.replace("/auth/login");
      else showMessage("error", err?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const [verifyRes, sessionsRes] = await Promise.all([
        api.get("/auth/verify").catch(() => ({ data: { data: {} } })),
        api.get("/auth/sessions").catch(() => ({ data: { data: [] } })),
      ]);
      setCurrentIp(verifyRes.data.data?.ip || "");
      setSessions(sessionsRes.data.data || []);
    } catch {
      // non-blocking
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      showMessage("error", "First name and last name are required");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
      });
      setAdmin(data.data);
      setForm({
        first_name: data.data.first_name || "",
        last_name: data.data.last_name || "",
        email: data.data.email || "",
        phone: data.data.phone || "",
      });
      showMessage("success", "Profile updated successfully");
    } catch (err) {
      showMessage("error", err?.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showMessage("error", "Current password is required");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showMessage("error", "New password must be at least 8 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPassword(false);
      showMessage("success", "Password changed successfully");
    } catch (err) {
      showMessage("error", err?.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  function toggleNotification(key) {
    const next = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(next);
    savePrefsByField("notificationPrefs", next);
  }

  function togglePrivacy(key) {
    const next = { ...privacyPrefs, [key]: !privacyPrefs[key] };
    setPrivacyPrefs(next);
    savePrefsByField("privacyPrefs", next);
  }

  async function savePrefsByField(field, value) {
    try {
      const { data } = await api.put("/auth/profile", { [field]: value });
      setAdmin((prev) => ({ ...prev, ...data.data }));
    } catch (err) {
      showMessage("error", err?.response?.data?.message || "Failed to save preferences");
    }
  }

  function Toggle({ checked, onChange, label, desc }) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={onChange}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E] ${
            checked ? "bg-[#0F766E]" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span className="sr-only">Toggle</span>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    );
  }

  if (loading) {
    return <AdminPageSkeleton variant="form" className="max-w-5xl" />;
  }

  if (!admin) return null;

  const fullName = `${admin?.first_name || ""} ${admin?.last_name || ""}`.trim() || "Admin";
  const initials = (admin?.first_name?.[0] || admin?.email?.[0] || "?").toUpperCase();

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account settings, security, and preferences</p>
        </div>
        <RoleBadge role={admin?.role} />
      </div>

      {message && (
        <div
          className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={dismissMessage} className="text-gray-400 hover:text-gray-700">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: "profile", label: "Profile", icon: FiUser },
            { id: "security", label: "Security", icon: FiLock },
            { id: "notifications", label: "Notifications", icon: FiBell },
            { id: "privacy", label: "Privacy", icon: FiShield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[#0F766E] border-b-2 border-[#0F766E]"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center text-3xl font-bold overflow-hidden">
                    {admin?.avatar_url ? (
                      <img src={admin.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <button
                    type="button"
                    disabled
                    title="Avatar upload requires a configured storage bucket"
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center text-gray-400 cursor-not-allowed"
                  >
                    <FiCamera className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2 flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Full Name</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="First name"
                          value={form.first_name}
                          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                        />
                        <input
                          type="text"
                          placeholder="Last name"
                          value={form.last_name}
                          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={form.email}
                        readOnly
                        disabled
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed"
                      />
                      <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email changes require account recovery</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 pl-10 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-1">
                  <StatusBadge status={admin?.status} className="border border-gray-200" />
                  <p className="text-xs text-gray-500">Role: <RoleBadge role={admin?.role} inline /></p>
                  {admin?.created_at && (
                    <p className="text-xs text-gray-500">Member since {formatDate(admin.created_at)}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 disabled:opacity-70 transition"
                >
                  {saving ? <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FiSave className="w-4 h-4 mr-2" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Change Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Update your password. Choose a strong password you do not use elsewhere.
                </p>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 pr-10 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">New Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 pr-10 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Confirm New Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 pr-10 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 disabled:opacity-70 transition"
                  >
                    {saving ? <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiLogOut className="w-4 h-4" /> Active Session
                </h3>
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {getBrowserLabel(typeof navigator !== "undefined" ? navigator.userAgent : "")}
                      {" "}
                      · {getDeviceLabel(typeof navigator !== "undefined" ? navigator.userAgent : "")}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {currentIp && (
                        <span className="inline-flex items-center gap-1">
                          <FiGlobe className="w-3 h-3" /> {currentIp}
                        </span>
                      )}
                      {admin?.last_login_at && (
                        <span className="inline-flex items-center gap-1">
                          <FiClock className="w-3 h-3" /> Last login {formatDate(admin.last_login_at)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-green-600 font-medium">Current session</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Sessions</h3>
                {sessionsLoading ? (
                  <div className="space-y-3" role="status" aria-busy="true">
                    <span className="sr-only">Loading…</span>
                    <SkeletonList count={3} itemClassName="p-4" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent sessions recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FiGlobe className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {s.action === "login" ? "Signed in" : "Signed out"} ·{" "}
                              {getBrowserLabel(s.userAgent)} on {getDeviceLabel(s.userAgent)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {s.ip} · {formatDate(s.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Notification Preferences</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how you want to be notified.</p>
              {NOTIFICATION_OPTIONS.map((opt) => (
                <Toggle
                  key={opt.key}
                  checked={!!notificationPrefs[opt.key]}
                  onChange={() => toggleNotification(opt.key)}
                  label={opt.label}
                  desc={opt.desc}
                />
              ))}
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Privacy Settings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Control who can see your information.</p>
              {PRIVACY_OPTIONS.map((opt) => (
                <Toggle
                  key={opt.key}
                  checked={!!privacyPrefs[opt.key]}
                  onChange={() => togglePrivacy(opt.key)}
                  label={opt.label}
                  desc={opt.desc}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
