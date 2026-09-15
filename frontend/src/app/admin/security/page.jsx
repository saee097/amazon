"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import {
  Shield,
  Lock,
  Key,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Settings,
  Users,
  Globe,
  Clock,
  Mail,
  Smartphone,
  Database,
  Terminal,
  Bell,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

const SETTING_GROUPS = [
  {
    id: "auth",
    title: "Authentication",
    icon: Lock,
    description: "Core authentication and login security",
    settings: [
      { key: "password_policy", label: "Password Policy", type: "select", options: ["weak", "medium", "strong"], description: "Minimum password strength required" },
      { key: "password_min_length", label: "Min Password Length", type: "number", min: 6, max: 64, description: "Minimum characters for passwords" },
      { key: "password_require_uppercase", label: "Require Uppercase", type: "boolean", description: "Force at least one uppercase letter" },
      { key: "password_require_lowercase", label: "Require Lowercase", type: "boolean", description: "Force at least one lowercase letter" },
      { key: "password_require_numbers", label: "Require Numbers", type: "boolean", description: "Force at least one number" },
      { key: "password_require_symbols", label: "Require Symbols", type: "boolean", description: "Force at least one special character" },
      { key: "password_max_age_days", label: "Password Expiry (days)", type: "number", min: 0, max: 365, description: "0 = never expire" },
      { key: "password_history_count", label: "Password History", type: "number", min: 0, max: 20, description: "Prevent reuse of last N passwords" },
    ],
  },
  {
    id: "2fa",
    title: "Two-Factor Authentication",
    icon: Shield,
    description: "Multi-factor authentication settings",
    settings: [
      { key: "two_factor_required", label: "Require 2FA for Admins", type: "boolean", description: "Mandate 2FA for all admin users" },
      { key: "two_factor_required_customers", label: "Require 2FA for Customers", type: "boolean", description: "Optional 2FA for customer accounts" },
      { key: "totp_issuer", label: "TOTP Issuer Name", type: "text", description: "Name shown in authenticator apps" },
      { key: "totp_window", label: "TOTP Window", type: "number", min: 0, max: 5, description: "Allowed time drift in 30s steps" },
      { key: "backup_codes_count", label: "Backup Codes Count", type: "number", min: 5, max: 20, description: "Number of backup codes generated" },
    ],
  },
  {
    id: "session",
    title: "Session Management",
    icon: Clock,
    description: "Session timeouts and concurrent session limits",
    settings: [
      { key: "session_timeout_minutes", label: "Session Timeout (min)", type: "number", min: 5, max: 1440, description: "Auto-logout after inactivity" },
      { key: "session_absolute_timeout_hours", label: "Absolute Timeout (hrs)", type: "number", min: 1, max: 168, description: "Force re-login after this many hours" },
      { key: "max_concurrent_sessions", label: "Max Concurrent Sessions", type: "number", min: 1, max: 10, description: "Limit simultaneous logins per user" },
      { key: "remember_me_days", label: "Remember Me Duration (days)", type: "number", min: 1, max: 365, description: "Extended session length" },
      { key: "session_secure_cookie", label: "Secure Cookies Only", type: "boolean", description: "Require HTTPS for session cookies" },
      { key: "session_same_site", label: "SameSite Policy", type: "select", options: ["lax", "strict", "none"], description: "CSRF protection level" },
    ],
  },
  {
    id: "rate_limit",
    title: "Rate Limiting & Brute Force",
    icon: AlertTriangle,
    description: "Protection against abuse and attacks",
    settings: [
      { key: "login_max_attempts", label: "Max Login Attempts", type: "number", min: 3, max: 20, description: "Failed attempts before lockout" },
      { key: "login_lockout_minutes", label: "Lockout Duration (min)", type: "number", min: 5, max: 1440, description: "Time before retry allowed" },
      { key: "login_lockout_ip_based", label: "IP-based Lockout", type: "boolean", description: "Track attempts by IP address" },
      { key: "api_rate_limit_per_minute", label: "API Rate Limit/min", type: "number", min: 10, max: 1000, description: "Requests per minute per IP" },
      { key: "password_reset_rate_limit_per_hour", label: "Password Resets/hour", type: "number", min: 1, max: 20, description: "Limit reset email frequency" },
      { key: "registration_rate_limit_per_hour", label: "Registrations/hour", type: "number", min: 1, max: 50, description: "Limit new accounts per IP" },
    ],
  },
  {
    id: "api",
    title: "API Security",
    icon: Terminal,
    description: "API keys, webhooks, and integration security",
    settings: [
      { key: "api_key_length", label: "API Key Length", type: "number", min: 32, max: 128, description: "Characters in generated API keys" },
      { key: "api_key_prefix", label: "API Key Prefix", type: "text", description: "Prefix for identifying keys (e.g., sk_live_)" },
      { key: "webhook_signature_header", label: "Webhook Signature Header", type: "text", description: "Header name for HMAC signatures" },
      { key: "webhook_timeout_seconds", label: "Webhook Timeout (s)", type: "number", min: 5, max: 60, description: "Max time to wait for webhook response" },
      { key: "webhook_max_retries", label: "Webhook Max Retries", type: "number", min: 0, max: 10, description: "Retry attempts for failed webhooks" },
      { key: "cors_allowed_origins", label: "CORS Allowed Origins", type: "textarea", description: "One origin per line, * for all" },
      { key: "api_version_header", label: "API Version Header", type: "text", description: "Header for API versioning" },
    ],
  },
  {
    id: "content",
    title: "Content Security",
    icon: Database,
    description: "File uploads, media, and content policies",
    settings: [
      { key: "max_upload_size_mb", label: "Max Upload Size (MB)", type: "number", min: 1, max: 100, description: "Maximum file upload size" },
      { key: "allowed_mime_types", label: "Allowed MIME Types", type: "textarea", description: "Comma-separated list (e.g., image/jpeg,image/png)" },
      { key: "scan_uploads_for_malware", label: "Scan Uploads", type: "boolean", description: "Enable malware scanning on uploads" },
      { key: "image_optimization_enabled", label: "Auto-optimize Images", type: "boolean", description: "Compress and resize uploaded images" },
      { key: "content_security_policy", label: "Content Security Policy", type: "textarea", description: "CSP header value" },
    ],
  },
  {
    id: "audit",
    title: "Audit & Logging",
    icon: Bell,
    description: "Security event logging and monitoring",
    settings: [
      { key: "audit_log_enabled", label: "Enable Audit Logging", type: "boolean", description: "Log all admin actions" },
      { key: "audit_log_retention_days", label: "Log Retention (days)", type: "number", min: 30, max: 2555, description: "Days to keep audit logs" },
      { key: "log_failed_logins", label: "Log Failed Logins", type: "boolean", description: "Record authentication failures" },
      { key: "log_admin_actions", label: "Log Admin Actions", type: "boolean", description: "Record all admin panel changes" },
      { key: "log_api_access", label: "Log API Access", type: "boolean", description: "Record API key usage" },
      { key: "security_email_alerts", label: "Email Alerts for Security Events", type: "boolean", description: "Notify admins of critical events" },
      { key: "security_alert_email", label: "Alert Email Address", type: "email", description: "Where to send security notifications" },
    ],
  },
  {
    id: "compliance",
    title: "Compliance & Privacy",
    icon: Users,
    description: "Data protection and regulatory settings",
    settings: [
      { key: "gdpr_enabled", label: "GDPR Compliance", type: "boolean", description: "Enable data portability/deletion requests" },
      { key: "ccpa_enabled", label: "CCPA Compliance", type: "boolean", description: "Enable California privacy rights" },
      { key: "data_retention_days", label: "Data Retention (days)", type: "number", min: 365, max: 3650, description: "Default customer data retention" },
      { key: "anonymize_on_delete", label: "Anonymize on Delete", type: "boolean", description: "Replace PII with anonymized data on deletion" },
      { key: "cookie_consent_required", label: "Require Cookie Consent", type: "boolean", description: "Show consent banner to visitors" },
      { key: "privacy_policy_url", label: "Privacy Policy URL", type: "url", description: "Link to privacy policy" },
      { key: "terms_of_service_url", label: "Terms of Service URL", type: "url", description: "Link to terms of service" },
    ],
  },
];

const DEFAULT_SETTINGS = {
  password_policy: "strong",
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_numbers: true,
  password_require_symbols: true,
  password_max_age_days: 90,
  password_history_count: 5,
  two_factor_required: true,
  two_factor_required_customers: false,
  totp_issuer: "Amazon Store",
  totp_window: 1,
  backup_codes_count: 10,
  session_timeout_minutes: 30,
  session_absolute_timeout_hours: 24,
  max_concurrent_sessions: 3,
  remember_me_days: 30,
  session_secure_cookie: true,
  session_same_site: "lax",
  login_max_attempts: 5,
  login_lockout_minutes: 15,
  login_lockout_ip_based: true,
  api_rate_limit_per_minute: 60,
  password_reset_rate_limit_per_hour: 3,
  registration_rate_limit_per_hour: 10,
  api_key_length: 64,
  api_key_prefix: "sk_live_",
  webhook_signature_header: "X-Webhook-Signature",
  webhook_timeout_seconds: 10,
  webhook_max_retries: 3,
  cors_allowed_origins: "*",
  api_version_header: "X-API-Version",
  max_upload_size_mb: 10,
  allowed_mime_types: "image/jpeg,image/png,image/webp,application/pdf",
  scan_uploads_for_malware: false,
  image_optimization_enabled: true,
  content_security_policy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
  audit_log_enabled: true,
  audit_log_retention_days: 365,
  log_failed_logins: true,
  log_admin_actions: true,
  log_api_access: false,
  security_email_alerts: true,
  security_alert_email: "security@example.com",
  gdpr_enabled: false,
  ccpa_enabled: false,
  data_retention_days: 2555,
  anonymize_on_delete: true,
  cookie_consent_required: true,
  privacy_policy_url: "/privacy",
  terms_of_service_url: "/terms",
};

function SettingInput({ setting, value, onChange, error }) {
  const { type, options, min, max, description } = setting;
  const commonClass = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/10 border-gray-300 dark:bg-gray-700 dark:text-gray-100";

  switch (type) {
    case "boolean":
      return (
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value === "true" || value === true}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="w-4 h-4 text-[#0F766E] border-gray-300 rounded focus:ring-[#0F766E]"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
        </label>
      );
    case "select":
      return (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass}>
          {options?.map((opt) => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
      );
    case "number":
      return (
        <input
          type="number"
          min={min}
          max={max}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
          placeholder={description}
        />
      );
    case "textarea":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={commonClass}
          placeholder={description}
        />
      );
    case "email":
      return (
        <input
          type="email"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
          placeholder={description}
        />
      );
    case "url":
      return (
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
          placeholder={description}
        />
      );
    default:
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
          placeholder={description}
        />
      );
  }
}

function SettingsSection({ group, settings, onChange, saving, errors }) {
  const [expanded, setExpanded] = useState(true);
  const Icon = group.icon;

  return (
    <div className="rounded-xl border border-gray-200 bg-white  dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        aria-expanded={expanded}
      >
        <Icon className="w-5 h-5 text-[#0F766E]" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{group.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{group.description}</p>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {group.settings.map((setting) => (
            <div key={setting.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {setting.label} <span className="text-rose-500">{setting.required ? "*" : ""}</span>
              </label>
              <SettingInput
                setting={setting}
                value={settings[setting.key] ?? DEFAULT_SETTINGS[setting.key] ?? ""}
                onChange={(val) => onChange(setting.key, val)}
                error={errors[setting.key]}
              />
              {setting.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
              )}
              {errors[setting.key] && (
                <p className="mt-1 text-sm text-rose-600">{errors[setting.key]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditLogFeed() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/logs", { params: { page, limit: 10 } });
      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-[#0F766E] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white  dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Bell size={20} className="text-[#0F766E]" />
          Recent Security Events
        </h3>
        <button onClick={load} className="text-sm text-[#0F766E] hover:underline">Refresh</button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Bell className="mx-auto text-gray-300" size={32} />
            <p className="mt-2">No security events recorded</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log._id} className="px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{log.action}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {log.resource}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {log.details ? JSON.stringify(log.details).slice(0, 120) : "No details"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {log.user?.email || "System"} · {new Date(log.created_at).toLocaleString()}
                    {log.ip_address && ` · ${log.ip_address}`}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50 dark:border-gray-600">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSecurity() {
  const toast = useToast();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/security");
      const loaded = {};
      (data.data || []).forEach((s) => { loaded[s.setting_key] = s.setting_value; });
      setSettings(loaded);
    } catch {
      toast.error("Failed to load security settings");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    Object.entries(settings).forEach(([key, value]) => {
      const setting = SETTING_GROUPS.flatMap(g => g.settings).find(s => s.key === key);
      if (!setting) return;
      if (setting.required && (!value || value === "")) {
        newErrors[key] = `${setting.label} is required`;
      }
      if (setting.type === "number" && value !== "") {
        const num = Number(value);
        if (isNaN(num)) newErrors[key] = "Must be a number";
        else if (setting.min !== undefined && num < setting.min) newErrors[key] = `Minimum is ${setting.min}`;
        else if (setting.max !== undefined && num > setting.max) newErrors[key] = `Maximum is ${setting.max}`;
      }
      if (setting.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[key] = "Invalid email format";
      }
      if (setting.type === "url" && value && !/^https?:\/\/.+/.test(value)) {
        newErrors[key] = "Must be a valid URL starting with http:// or https://";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix validation errors");
      return;
    }
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([setting_key, setting_value]) => ({
        setting_key,
        setting_value: String(value),
        description: SETTING_GROUPS.flatMap(g => g.settings).find(s => s.key === setting_key)?.description || "",
      }));
      for (const update of updates) {
        await api.put("/admin/security", update);
      }
      toast.success("Security settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all settings to defaults?")) return;
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        await api.put("/admin/security", { setting_key: key, setting_value: String(value) });
      }
      toast.success("Settings reset to defaults");
      load();
    } catch {
      toast.error("Failed to reset settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ToastProvider>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#0F766E] border-t-transparent" />
            <p className="mt-3 text-sm text-gray-500">Loading security settings…</p>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-100 flex items-center gap-2">
              <Shield size={24} className="text-[#0F766E]" />
              Security Settings
            </h1>
            <p className="mt-1 text-sm text-gray-500">Configure authentication, sessions, rate limiting, and compliance</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700  hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
              <RefreshCw size={14} />
              Reset Defaults
            </button>
            <button onClick={handleSave} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0F766E] px-4 text-sm font-semibold text-white  hover:bg-[#0F766E]/90 disabled:opacity-60">
              <Save size={16} />
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Save All"}
            </button>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p className="font-medium">Please fix {Object.keys(errors).length} validation error(s) before saving</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {SETTING_GROUPS.map((group) => (
            <SettingsSection
              key={group.id}
              group={group}
              settings={settings}
              onChange={handleChange}
              saving={saving}
              errors={errors}
            />
          ))}
        </div>

        <AuditLogFeed />
      </div>
    </ToastProvider>
  );
}