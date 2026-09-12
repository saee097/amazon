"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ROLES } from "@/lib/rbac";
import {
  FiSave,
  FiX,
  FiShield,
  FiMail,
  FiSettings,
  FiLock,
  FiRefreshCw,
} from "react-icons/fi";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState({
    general: { storeName: "", supportEmail: "", currency: "USD", timezone: "UTC" },
    security: { passwordPolicy: "strong", twoFactorRequired: false, sessionTimeout: 30 },
    email: { smtpHost: "", smtpPort: 587, smtpUser: "", smtpPassword: "", fromEmail: "" },
    maintenance: { enabled: false, message: "" },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await api.get("/admin/settings");
      if (data.data) {
        setSettings((prev) => ({ ...prev, ...data.data }));
      }
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put("/admin/settings", settings[activeTab]);
      setSuccess("Settings saved successfully");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset settings to defaults?")) return;
    setSettings({
      general: { storeName: "", supportEmail: "", currency: "USD", timezone: "UTC" },
      security: { passwordPolicy: "strong", twoFactorRequired: false, sessionTimeout: 30 },
      email: { smtpHost: "", smtpPort: 587, smtpUser: "", smtpPassword: "", fromEmail: "" },
      maintenance: { enabled: false, message: "" },
    });
    setSuccess("Settings reset to defaults");
  };

  const tabs = [
    { id: "general", label: "General", icon: FiSettings },
    { id: "security", label: "Security", icon: FiShield },
    { id: "email", label: "Email", icon: FiMail },
    { id: "maintenance", label: "Maintenance", icon: FiRefreshCw },
  ];

  const currentSettings = settings[activeTab];

  return (
    <div className="max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Configure your store settings</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3">
              {success}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {tabs.map((tab) => {
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

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {activeTab === "general" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Store Name</label>
                    <input
                      type="text"
                      value={currentSettings.storeName}
                      onChange={(e) => setSettings({ ...settings, general: { ...settings.general, storeName: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={currentSettings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, general: { ...settings.general, supportEmail: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Currency</label>
                    <select
                      value={currentSettings.currency}
                      onChange={(e) => setSettings({ ...settings, general: { ...settings.general, currency: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Timezone</label>
                    <select
                      value={currentSettings.timezone}
                      onChange={(e) => setSettings({ ...settings, general: { ...settings.general, timezone: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Asia/Kolkata">India Standard Time</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Password Policy</label>
                    <select
                      value={currentSettings.passwordPolicy}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, passwordPolicy: e.target.value } })}
                      className="w-full sm:w-1/2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="standard">Standard (8+ chars)</option>
                      <option value="strong">Strong (12+ chars, mixed case, numbers, symbols)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="twoFactorRequired"
                      checked={currentSettings.twoFactorRequired}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, twoFactorRequired: e.target.checked } })}
                      className="w-5 h-5 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <label htmlFor="twoFactorRequired" className="text-sm text-gray-700 dark:text-gray-200">
                      Require two-factor authentication for all admins
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={currentSettings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeout: parseInt(e.target.value) || 30 } })}
                      className="w-full sm:w-1/3 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}

              {activeTab === "email" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={currentSettings.smtpHost}
                      onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpHost: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={currentSettings.smtpPort}
                      onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpPort: parseInt(e.target.value) || 587 } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">SMTP User</label>
                    <input
                      type="text"
                      value={currentSettings.smtpUser}
                      onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpUser: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">SMTP Password</label>
                    <input
                      type="password"
                      value={currentSettings.smtpPassword}
                      onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtpPassword: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">From Email</label>
                    <input
                      type="email"
                      value={currentSettings.fromEmail}
                      onChange={(e) => setSettings({ ...settings, email: { ...settings.email, fromEmail: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}

              {activeTab === "maintenance" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="maintenanceEnabled"
                      checked={currentSettings.enabled}
                      onChange={(e) => setSettings({ ...settings, maintenance: { ...settings.maintenance, enabled: e.target.checked } })}
                      className="w-5 h-5 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <label htmlFor="maintenanceEnabled" className="text-sm text-gray-700 dark:text-gray-200">
                      Enable maintenance mode
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Maintenance Message</label>
                    <textarea
                      value={currentSettings.message}
                      onChange={(e) => setSettings({ ...settings, maintenance: { ...settings.maintenance, message: e.target.value } })}
                      rows={4}
                      placeholder="We'll be back soon!"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:border-[#0F766E] dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm"
                >
                  Reset to Defaults
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0F766E]/90 disabled:opacity-70"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
